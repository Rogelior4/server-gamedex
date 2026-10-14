/**
 * Utilidades avanzadas de búsqueda difusa (fuzzy search), normalización de texto,
 * tokenización y cálculo de distancia/similitud para sugerencias resilientes a errores de escritura.
 */

export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos y diacríticos
    .replace(/[™®©]/g, '') // Eliminar símbolos de marcas
    .replace(/[^a-z0-9\s]/g, ' ') // Convertir cualquier puntuación (: - _ / . , ' etc.) a espacio
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          matrix[i][j - 1] + 1, // inserción
          matrix[i - 1][j] + 1, // eliminación
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function stringSimilarity(a: string, b: string): number {
  const normA = normalizeSearchText(a);
  const normB = normalizeSearchText(b);
  if (!normA.length || !normB.length) return 0;
  if (normA === normB) return 1;

  const maxLen = Math.max(normA.length, normB.length);
  const dist = levenshteinDistance(normA, normB);
  return Math.max(0, (maxLen - dist) / maxLen);
}

/**
 * Calcula un puntaje de relevancia (0 a 1500+) evaluando coincidencia exacta,
 * prefijo, subcadena, tokens/palabras, acrónimos y tolerancia a faltas de ortografía (typos).
 */
export function calculateMatchScore(
  query: string,
  title: string,
  aliases: string[] = [],
): number {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return 0;

  const normTitle = normalizeSearchText(title);
  const normAliases = aliases.map((a) => normalizeSearchText(a)).filter(Boolean);
  const allTargets = [normTitle, ...normAliases];

  let bestScore = 0;

  // 1. Coincidencia exacta con título o alias
  for (const target of allTargets) {
    if (target === normQuery) {
      bestScore = Math.max(bestScore, 1000);
    } else if (target.startsWith(normQuery)) {
      bestScore = Math.max(bestScore, 750);
    } else if (target.includes(normQuery)) {
      bestScore = Math.max(bestScore, 600);
    }
  }

  // 2. Tokenización y coincidencia multi-palabra (ej. "zelda tears" en "the legend of zelda tears of the kingdom")
  const queryTokens = normQuery.split(' ').filter((t) => t.length > 0);
  const titleWords = normTitle.split(' ').filter((t) => t.length > 0);

  if (queryTokens.length > 0) {
    let matchedTokensCount = 0;
    let tokenScoreAccumulator = 0;

    for (const qToken of queryTokens) {
      let bestTokenMatch = 0;

      // Evaluar contra las palabras del título y aliases
      for (const tWord of titleWords) {
        if (tWord === qToken) {
          bestTokenMatch = Math.max(bestTokenMatch, 1.0);
        } else if (tWord.startsWith(qToken) && qToken.length >= 3) {
          bestTokenMatch = Math.max(bestTokenMatch, 0.85);
        } else if (tWord.includes(qToken) && qToken.length >= 4) {
          bestTokenMatch = Math.max(bestTokenMatch, 0.7);
        } else if (qToken.length >= 4 && tWord.length >= 4) {
          // Tolerancia a typo en token individual (ej. "teatrs" vs "tears")
          const dist = levenshteinDistance(qToken, tWord);
          if (dist === 1) {
            bestTokenMatch = Math.max(bestTokenMatch, 0.75);
          } else if (dist === 2 && (qToken.length >= 6 || tWord.length >= 6)) {
            bestTokenMatch = Math.max(bestTokenMatch, 0.5);
          }
        }
      }

      // Si no encontró en el título directo, verificar contra aliases completos
      if (bestTokenMatch < 0.8) {
        for (const alias of normAliases) {
          if (alias.includes(qToken)) {
            bestTokenMatch = Math.max(bestTokenMatch, 0.8);
          }
        }
      }

      if (bestTokenMatch >= 0.5) {
        matchedTokensCount++;
        tokenScoreAccumulator += bestTokenMatch;
      }
    }

    const tokenRatio = matchedTokensCount / queryTokens.length;

    // Si todas las palabras que escribió el usuario coinciden en el título
    if (tokenRatio === 1) {
      const tokenBonus = 500 * (tokenScoreAccumulator / queryTokens.length);
      bestScore = Math.max(bestScore, tokenBonus);
    } else if (tokenRatio >= 0.5 && queryTokens.length > 1) {
      // Coincidencia parcial de tokens
      const tokenBonus = 300 * tokenRatio * (tokenScoreAccumulator / matchedTokensCount);
      bestScore = Math.max(bestScore, tokenBonus);
    }
  }

  // 3. Chequeo de siglas / acrónimos (ej: "totk" -> "The Legend Of Tears Of The Kingdom", "botw", "gow", "lol")
  const significantInitials = titleWords
    .filter((w) => !['the', 'of', 'and', 'a', 'an', 'in', 'on', 'for'].includes(w))
    .map((w) => w[0])
    .join('');
  const allInitials = titleWords.map((w) => w[0]).join('');

  if (
    normQuery.length >= 2 &&
    (significantInitials === normQuery || allInitials.includes(normQuery) || significantInitials.includes(normQuery))
  ) {
    bestScore = Math.max(bestScore, 550);
  }

  // 4. Similitud global de cadena para typos en nombres cortos o completos (ej. "zeld tears" vs "zelda tears")
  for (const target of allTargets) {
    const sim = stringSimilarity(normQuery, target);
    if (sim >= 0.7) {
      bestScore = Math.max(bestScore, Math.round(sim * 500));
    } else if (sim >= 0.5 && bestScore === 0) {
      bestScore = Math.max(bestScore, Math.round(sim * 300));
    }
  }

  return bestScore;
}
