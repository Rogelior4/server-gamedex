import { Injectable } from '@nestjs/common';
import { GameSearchResult, IMetadataProvider } from './metadata.interface';
import { calculateMatchScore } from './match-utils';

interface CuratedGame {
  id: string;
  title: string;
  aliases?: string[];
  platform: string;
  source: string;
  coverUrl: string;
  headerUrl?: string;
  storeUrl?: string;
  launcherUri?: string;
}

@Injectable()
export class LauncherCatalogProvider implements IMetadataProvider {
  readonly source = 'catalog';
  readonly name = 'Launcher Catalog';

  private readonly catalog: CuratedGame[] = [
    // Riot Games
    {
      id: 'riot-lol',
      title: 'League of Legends',
      aliases: ['lol', 'league', 'rift'],
      platform: 'Riot Games',
      source: 'riot',
      coverUrl:
        'https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt490d19f85c1844b2/655f5f4f71a4f004077d206f/League_of_Legends_Key_Art.jpg',
      headerUrl:
        'https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt490d19f85c1844b2/655f5f4f71a4f004077d206f/League_of_Legends_Key_Art.jpg',
      storeUrl: 'https://www.leagueoflegends.com/',
      launcherUri: 'riotclient://launch?product=league_of_legends&patchline=live',
    },
    {
      id: 'riot-val',
      title: 'Valorant',
      aliases: ['val', 'vlr'],
      platform: 'Riot Games',
      source: 'riot',
      coverUrl:
        'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt7f2a15c8c6d1d4f2/5ebc08929940730b77da1691/V_AGENTS_587x900_ALL_Jett_wBg.png',
      headerUrl:
        'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt0da55b763aa8732f/649dcf47a32e1850fb4e0b0e/VALORANT_Episode7_KeyArt_1920x1080.jpg',
      storeUrl: 'https://playvalorant.com/',
      launcherUri: 'riotclient://launch?product=valorant&patchline=live',
    },
    {
      id: 'riot-tft',
      title: 'Teamfight Tactics',
      aliases: ['tft'],
      platform: 'Riot Games',
      source: 'riot',
      coverUrl:
        'https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt6d57b5f63d088924/655bcae7dc9ef94d4d38ff0b/TFT_Key_Art.jpg',
      storeUrl: 'https://teamfighttactics.leagueoflegends.com/',
      launcherUri: 'riotclient://launch?product=league_of_legends&patchline=live',
    },
    {
      id: 'riot-lor',
      title: 'Legends of Runeterra',
      aliases: ['lor', 'runeterra'],
      platform: 'Riot Games',
      source: 'riot',
      coverUrl:
        'https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt47ecfc6fe98f126d/655f5e3fe9b7754d929be5a2/LoR_Key_Art.jpg',
      storeUrl: 'https://playruneterra.com/',
      launcherUri: 'riotclient://launch?product=bacon&patchline=live',
    },
    {
      id: 'riot-2xko',
      title: '2XKO',
      aliases: ['project l'],
      platform: 'Riot Games',
      source: 'riot',
      coverUrl:
        'https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt61ef90c9b0e2dc11/65d7870a4ef5fc56c805fa60/2XKO_KeyArt_Vertical.jpg',
      storeUrl: 'https://2xko.riotgames.com/',
    },

    // Battle.net (Blizzard / Activision)
    {
      id: 'bnet-wow',
      title: 'World of Warcraft',
      aliases: ['wow', 'warcraft', 'the war within', 'dragonflight'],
      platform: 'Battle.net',
      source: 'battlenet',
      coverUrl:
        'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt4821a812df08ce4e/654515598bf0ca2c803328e3/TWW_Standard_Box_Art.png',
      headerUrl:
        'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltbfe4f91efbb94f75/654553f191b29a28bfdf91fa/TWW_Masthead_Desktop_2880x1200.jpg',
      storeUrl: 'https://worldofwarcraft.blizzard.com/',
      launcherUri: 'battlenet://WoW',
    },
    {
      id: 'bnet-d4',
      title: 'Diablo IV',
      aliases: ['d4', 'diablo 4', 'vessel of hatred'],
      platform: 'Battle.net',
      source: 'battlenet',
      coverUrl:
        'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt3b78c8959d04da64/636d934bb7e7e57c6b907fe2/D4_BoxArt.jpg',
      headerUrl:
        'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt8dcbb0233ea1e2e1/64627d704d2e2b83446002f2/D4_StandardEdition_Masthead_Desktop_2880x1200.jpg',
      storeUrl: 'https://diablo4.blizzard.com/',
      launcherUri: 'battlenet://Fen',
    },
    {
      id: 'bnet-ow2',
      title: 'Overwatch 2',
      aliases: ['ow', 'ow2', 'overwatch'],
      platform: 'Battle.net',
      source: 'battlenet',
      coverUrl:
        'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt0d2c94380ae84ea9/62a11b6d05f32353a3bc96ea/OW2_BoxArt.jpg',
      headerUrl:
        'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt6d5bfbb62e5b85a3/62a39281a79fa451007ee236/OW2_Masthead_Desktop_2880x1200.jpg',
      storeUrl: 'https://overwatch.blizzard.com/',
      launcherUri: 'battlenet://Pro',
    },
    {
      id: 'bnet-hs',
      title: 'Hearthstone',
      aliases: ['hs'],
      platform: 'Battle.net',
      source: 'battlenet',
      coverUrl:
        'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt47d25e0b6bbfb6fb/5d0959f71c4c11fa0599a4e8/HS_BoxArt.jpg',
      storeUrl: 'https://hearthstone.blizzard.com/',
      launcherUri: 'battlenet://WTCG',
    },
    {
      id: 'bnet-sc2',
      title: 'StarCraft II',
      aliases: ['sc2', 'starcraft 2'],
      platform: 'Battle.net',
      source: 'battlenet',
      coverUrl:
        'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt1cbcaee7b396e95c/5d095a5f1c4c11fa0599a4fc/SC2_BoxArt.jpg',
      storeUrl: 'https://starcraft2.blizzard.com/',
      launcherUri: 'battlenet://S2',
    },
    {
      id: 'bnet-warzone',
      title: 'Call of Duty: Warzone',
      aliases: ['cod', 'warzone', 'modern warfare'],
      platform: 'Battle.net',
      source: 'battlenet',
      coverUrl:
        'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blte81cbe812dcf6b86/63645cb75ff17b6a12269a23/WZ2_BoxArt.jpg',
      storeUrl: 'https://www.callofduty.com/warzone',
      launcherUri: 'battlenet://VIPR',
    },

    // EA App (Electronic Arts)
    {
      id: 'ea-fc25',
      title: 'EA SPORTS FC 25',
      aliases: ['fc 25', 'fifa 25', 'fc25', 'fifa'],
      platform: 'EA App',
      source: 'ea',
      coverUrl:
        'https://media.contentapi.ea.com/content/dam/ea/ea-sports-fc/fc-25/common/fc25-standard-boxart-1x1.jpg.adapt.crop191x100.1200w.jpg',
      storeUrl: 'https://www.ea.com/games/ea-sports-fc/fc-25',
    },
    {
      id: 'ea-apex',
      title: 'Apex Legends',
      aliases: ['apex'],
      platform: 'EA App',
      source: 'ea',
      coverUrl:
        'https://media.contentapi.ea.com/content/dam/apex-legends/common/apex-section-image-breakout-m.png.adapt.crop16x9.575p.png',
      headerUrl:
        'https://media.contentapi.ea.com/content/dam/apex-legends/common/apex-legends-masthead-m.jpg.adapt.crop16x9.1023w.jpg',
      storeUrl: 'https://www.ea.com/games/apex-legends',
    },
    {
      id: 'ea-sims4',
      title: 'The Sims 4',
      aliases: ['sims', 'sims 4'],
      platform: 'EA App',
      source: 'ea',
      coverUrl:
        'https://media.contentapi.ea.com/content/dam/ea/the-sims/the-sims-4/common/ts4-f2p-basegame-pack-art.png.adapt.crop1x1.320w.png',
      storeUrl: 'https://www.ea.com/games/the-sims/the-sims-4',
    },
    {
      id: 'ea-bf2042',
      title: 'Battlefield 2042',
      aliases: ['bf2042', 'battlefield'],
      platform: 'EA App',
      source: 'ea',
      coverUrl:
        'https://media.contentapi.ea.com/content/dam/battlefield/battlefield-2042/images/2021/04/k-1x1-packart.jpg.adapt.crop1x1.320w.jpg',
      storeUrl: 'https://www.ea.com/games/battlefield/battlefield-2042',
    },
    {
      id: 'ea-dav',
      title: 'Dragon Age: The Veilguard',
      aliases: ['veilguard', 'dragon age'],
      platform: 'EA App',
      source: 'ea',
      coverUrl:
        'https://media.contentapi.ea.com/content/dam/ea/dragon-age/dragon-age-the-veilguard/common/datv-standard-edition-pack-art.jpg.adapt.crop1x1.320w.jpg',
      storeUrl: 'https://www.ea.com/games/dragon-age/dragon-age-the-veilguard',
    },

    // Ubisoft Connect
    {
      id: 'ubi-r6',
      title: "Tom Clancy's Rainbow Six Siege",
      aliases: ['r6', 'rainbow six', 'siege', 'rainbow 6'],
      platform: 'Ubisoft Connect',
      source: 'ubisoft',
      coverUrl:
        'https://staticctf.akamaized.net/J3yJr34U2pZcxskAnaAlLggpqvYr8gNp/1Kj2G8vVv4cRjTeqN0Wv2m/5a676c8bb79679808dafc7360ca03478/r6s_standard_edition_packshot.jpg',
      storeUrl: 'https://www.ubisoft.com/game/rainbow-six/siege',
      launcherUri: 'uplay://launch/635/0',
    },
    {
      id: 'ubi-ac-shadows',
      title: "Assassin's Creed Shadows",
      aliases: ['ac shadows', 'assassins creed shadows', 'ac red'],
      platform: 'Ubisoft Connect',
      source: 'ubisoft',
      coverUrl:
        'https://staticctf.akamaized.net/J3yJr34U2pZcxskAnaAlLggpqvYr8gNp/7G3dK1hB7pWqXzQ0mF4yA/ac_shadows_boxart.jpg',
      storeUrl: 'https://www.ubisoft.com/game/assassins-creed/shadows',
    },
    {
      id: 'ubi-ac-mirage',
      title: "Assassin's Creed Mirage",
      aliases: ['ac mirage', 'assassins creed mirage'],
      platform: 'Ubisoft Connect',
      source: 'ubisoft',
      coverUrl:
        'https://staticctf.akamaized.net/J3yJr34U2pZcxskAnaAlLggpqvYr8gNp/4qZ9Gk2hB8pQvXzY0mF4yA/acm_boxart.jpg',
      storeUrl: 'https://www.ubisoft.com/game/assassins-creed/mirage',
    },
    {
      id: 'ubi-xdefiant',
      title: 'XDefiant',
      aliases: ['xdefiant', 'xd'],
      platform: 'Ubisoft Connect',
      source: 'ubisoft',
      coverUrl:
        'https://staticctf.akamaized.net/J3yJr34U2pZcxskAnaAlLggpqvYr8gNp/2F3dK1hB7pWqXzQ0mF4yA/xdefiant_packshot.jpg',
      storeUrl: 'https://www.ubisoft.com/game/xdefiant',
    },

    // Xbox / Microsoft Flagships
    {
      id: 'xbox-halo-inf',
      title: 'Halo Infinite',
      aliases: ['halo'],
      platform: 'Xbox',
      source: 'xbox',
      coverUrl:
        'https://store-images.s-microsoft.com/image/apps.50670.13727851868390641.c9cc5f66-aff8-406c-af6b-440838730be0.d205e025-5444-4eb1-ae46-571ae6d252c4',
      storeUrl: 'https://www.xbox.com/games/store/halo-infinite/9pp5g1f0c2b6',
    },
    {
      id: 'xbox-forza5',
      title: 'Forza Horizon 5',
      aliases: ['fh5', 'forza 5', 'forza horizon'],
      platform: 'Xbox',
      source: 'xbox',
      coverUrl:
        'https://store-images.s-microsoft.com/image/apps.34091.13797135439504505.b788a104-a1e4-4a81-9b6d-d1ef1dcfa760.155a022b-fb19-4876-b63e-324e525164cf',
      storeUrl: 'https://www.xbox.com/games/store/forza-horizon-5/9nkxg7ttcr85',
    },
    {
      id: 'xbox-starfield',
      title: 'Starfield',
      aliases: ['starfield'],
      platform: 'Xbox',
      source: 'xbox',
      coverUrl:
        'https://store-images.s-microsoft.com/image/apps.43952.14441584282361667.62586716-1025-4c60-8f9d-1f5f2a1ebc86.44e78298-500b-4e89-8d8a-8be8a95efd58',
      storeUrl: 'https://www.xbox.com/games/store/starfield/9ncclnkgjx88',
    },
    {
      id: 'xbox-sea-of-thieves',
      title: 'Sea of Thieves',
      aliases: ['sot'],
      platform: 'Xbox',
      source: 'xbox',
      coverUrl:
        'https://store-images.s-microsoft.com/image/apps.54471.13968254245667823.1fb511b0-e374-42b7-8d38-2d3a3eb1772d.4df36d29-c7c4-42ff-bfad-d3d0f01eb02b',
      storeUrl: 'https://www.xbox.com/games/store/sea-of-thieves/9p2n57mc619k',
    },
    {
      id: 'xbox-minecraft',
      title: 'Minecraft',
      aliases: ['mc', 'minecraft bedrock', 'minecraft java'],
      platform: 'Xbox',
      source: 'xbox',
      coverUrl:
        'https://store-images.s-microsoft.com/image/apps.16894.13510798887584980.e12330a1-2487-4340-9b48-185d3f23a6f9.5442be7c-a4ec-44f0-8c29-873ce36ad0b3',
      storeUrl: 'https://www.xbox.com/games/store/minecraft/9nxp44l49h13',
    },

    // PlayStation Flagships
    {
      id: 'ps-bloodborne',
      title: 'Bloodborne',
      aliases: ['bb'],
      platform: 'PlayStation 5',
      source: 'playstation',
      coverUrl:
        'https://image.api.playstation.com/vulcan/img/rnd/202010/2614/NV5e7vN7Y8G2N90G9cW8u8d9.png',
      storeUrl: 'https://store.playstation.com/concept/200424',
    },
    {
      id: 'ps-gow-ragnarok',
      title: 'God of War Ragnarök',
      aliases: ['gow', 'god of war', 'ragnarok'],
      platform: 'PlayStation 5',
      source: 'playstation',
      coverUrl:
        'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/aqcocLugrTGjXhUj2vQ9fGvN.png',
      storeUrl: 'https://store.playstation.com/concept/10002694',
    },
    {
      id: 'ps-tlou-part1',
      title: 'The Last of Us Part I',
      aliases: ['tlou', 'the last of us', 'tlou1'],
      platform: 'PlayStation 5',
      source: 'playstation',
      coverUrl:
        'https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/eEczyEMdd2BLa3dtkGJILdrM.png',
      storeUrl: 'https://store.playstation.com/concept/10002693',
    },
    {
      id: 'ps-spiderman-2',
      title: "Marvel's Spider-Man 2",
      aliases: ['spiderman', 'spider-man 2', 'spiderman 2'],
      platform: 'PlayStation 5',
      source: 'playstation',
      coverUrl:
        'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8b4e31952a2d7f87e5b9f71c4d9241ec26a0c23fe.png',
      storeUrl: 'https://store.playstation.com/concept/10002456',
    },

    // Nintendo DS & Classics
    {
      id: 'nds-zelda-spirit-tracks',
      title: 'The Legend of Zelda: Spirit Tracks',
      aliases: ['spirit tracks', 'zelda spirit tracks', 'zelda ds'],
      platform: 'Nintendo DS',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/91/The_Legend_of_Zelda_Spirit_Tracks_box_art.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/91/The_Legend_of_Zelda_Spirit_Tracks_box_art.jpg',
      storeUrl: 'https://www.nintendo.com/search/#q=The%20Legend%20of%20Zelda%3A%20Spirit%20Tracks',
    },
    {
      id: 'nds-zelda-phantom-hourglass',
      title: 'The Legend of Zelda: Phantom Hourglass',
      aliases: ['phantom hourglass', 'zelda phantom hourglass'],
      platform: 'Nintendo DS',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/91/The_Legend_of_Zelda_Phantom_Hourglass_box_art.png',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/91/The_Legend_of_Zelda_Phantom_Hourglass_box_art.png',
      storeUrl: 'https://www.nintendo.com/search/#q=The%20Legend%20of%20Zelda%3A%20Phantom%20Hourglass',
    },
    {
      id: 'n64-zelda-oot',
      title: 'The Legend of Zelda: Ocarina of Time',
      aliases: ['ocarina of time', 'oot', 'zelda 64'],
      platform: 'Nintendo 64',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/5/57/The_Legend_of_Zelda_Ocarina_of_Time.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/5/57/The_Legend_of_Zelda_Ocarina_of_Time.jpg',
      storeUrl: 'https://www.nintendo.com/search/#q=Ocarina%20of%20Time',
    },
    {
      id: 'n64-zelda-mm',
      title: "The Legend of Zelda: Majora's Mask",
      aliases: ['majoras mask', 'majora', 'mm'],
      platform: 'Nintendo 64',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/6/60/The_Legend_of_Zelda_-_Majora%27s_Mask_Box_Art.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/6/60/The_Legend_of_Zelda_-_Majora%27s_Mask_Box_Art.jpg',
      storeUrl: 'https://www.nintendo.com/search/#q=Majoras%20Mask',
    },
    {
      id: 'gc-zelda-ww',
      title: 'The Legend of Zelda: The Wind Waker',
      aliases: ['wind waker', 'ww'],
      platform: 'GameCube',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/7/7a/The_Legend_of_Zelda_The_Wind_Waker_cover.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/7/7a/The_Legend_of_Zelda_The_Wind_Waker_cover.jpg',
      storeUrl: 'https://www.nintendo.com/search/#q=The%20Wind%20Waker',
    },
    {
      id: 'wii-zelda-tp',
      title: 'The Legend of Zelda: Twilight Princess',
      aliases: ['twilight princess', 'tp'],
      platform: 'Wii',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/d/dd/The_Legend_of_Zelda_Twilight_Princess_Game_Cover.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/d/dd/The_Legend_of_Zelda_Twilight_Princess_Game_Cover.jpg',
      storeUrl: 'https://www.nintendo.com/search/#q=Twilight%20Princess',
    },
    {
      id: 'gba-zelda-minish',
      title: 'The Legend of Zelda: The Minish Cap',
      aliases: ['minish cap', 'zelda gba'],
      platform: 'Game Boy Advance',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/a/a5/The_Legend_of_Zelda_The_Minish_Cap_Game_Cover.JPG',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/a/a5/The_Legend_of_Zelda_The_Minish_Cap_Game_Cover.JPG',
      storeUrl: 'https://www.nintendo.com/search/#q=The%20Minish%20Cap',
    },
    {
      id: 'snes-zelda-alttp',
      title: 'The Legend of Zelda: A Link to the Past',
      aliases: ['link to the past', 'alttp'],
      platform: 'Super Nintendo (SNES)',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/2/21/The_Legend_of_Zelda_A_Link_to_the_Past_SNES_Game_Cover.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/2/21/The_Legend_of_Zelda_A_Link_to_the_Past_SNES_Game_Cover.jpg',
      storeUrl: 'https://www.nintendo.com/search/#q=A%20Link%20to%20the%20Past',
    },
    {
      id: '3ds-zelda-albw',
      title: 'The Legend of Zelda: A Link Between Worlds',
      aliases: ['link between worlds', 'albw'],
      platform: 'Nintendo 3DS',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/7/72/The_Legend_of_Zelda_A_Link_Between_Worlds_box_art.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/7/72/The_Legend_of_Zelda_A_Link_Between_Worlds_box_art.jpg',
      storeUrl: 'https://www.nintendo.com/search/#q=A%20Link%20Between%20Worlds',
    },
    {
      id: 'nds-mario-kart-ds',
      title: 'Mario Kart DS',
      aliases: ['mkds', 'mario kart ds'],
      platform: 'Nintendo DS',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/2/23/Mario_Kart_DS_cover.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/2/23/Mario_Kart_DS_cover.jpg',
      storeUrl: 'https://www.nintendo.com/search/#q=Mario%20Kart%20DS',
    },
    {
      id: 'nds-pokemon-platinum',
      title: 'Pokémon Platinum Version',
      aliases: ['pokemon platinum', 'platinum'],
      platform: 'Nintendo DS',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/e/e0/Pokemon_Platinum_Packshot.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/e/e0/Pokemon_Platinum_Packshot.jpg',
      storeUrl: 'https://www.pokemon.com/us/pokemon-video-games/pokemon-platinum-version',
    },

    // Nintendo Switch Flagships & Exclusives
    {
      id: 'switch-zelda-totk',
      title: 'The Legend of Zelda: Tears of the Kingdom',
      aliases: [
        'zelda tears',
        'zelda totk',
        'totk',
        'tears of the kingdom',
        'zelda tears of the kingdom',
        'zelda switch',
      ],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/software/switch/70010000063714/a58de3d01490231aa83c509ab82e7534440026e632e8bfe0b6ffec9cb2fe18c1',
      headerUrl:
        'https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/software/switch/70010000063714/a58de3d01490231aa83c509ab82e7534440026e632e8bfe0b6ffec9cb2fe18c1',
      storeUrl:
        'https://www.nintendo.com/us/store/products/the-legend-of-zelda-tears-of-the-kingdom-switch/',
    },
    {
      id: 'switch-zelda-botw',
      title: 'The Legend of Zelda: Breath of the Wild',
      aliases: [
        'zelda botw',
        'botw',
        'breath of the wild',
        'zelda breath of the wild',
      ],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg',
      storeUrl:
        'https://www.nintendo.com/us/store/products/the-legend-of-zelda-breath-of-the-wild-switch/',
    },
    {
      id: 'switch-zelda-echoes',
      title: 'The Legend of Zelda: Echoes of Wisdom',
      aliases: [
        'echoes of wisdom',
        'eow',
        'zelda echoes',
        'zelda echoes of wisdom',
      ],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/90/The_Legend_of_Zelda_Echoes_of_Wisdom_cover_art.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/90/The_Legend_of_Zelda_Echoes_of_Wisdom_cover_art.jpg',
      storeUrl:
        'https://www.nintendo.com/us/store/products/the-legend-of-zelda-echoes-of-wisdom-switch/',
    },
    {
      id: 'switch-zelda-la',
      title: "The Legend of Zelda: Link's Awakening",
      aliases: ['links awakening', 'zelda links awakening'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/8/86/The_Legend_of_Zelda_Link%27s_Awakening_%282019_video_game%29_box_art.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/8/86/The_Legend_of_Zelda_Link%27s_Awakening_%282019_video_game%29_box_art.jpg',
      storeUrl:
        'https://www.nintendo.com/us/store/products/the-legend-of-zelda-links-awakening-switch/',
    },
    {
      id: 'switch-zelda-ss-hd',
      title: 'The Legend of Zelda: Skyward Sword HD',
      aliases: ['skyward sword', 'zelda skyward sword', 'skyward sword hd'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/e/e0/The_Legend_of_Zelda_Skyward_Sword_HD_box_art.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/e/e0/The_Legend_of_Zelda_Skyward_Sword_HD_box_art.jpg',
      storeUrl:
        'https://www.nintendo.com/us/store/products/the-legend-of-zelda-skyward-sword-hd-switch/',
    },
    {
      id: 'switch-mario-odyssey',
      title: 'Super Mario Odyssey',
      aliases: ['mario odyssey', 'odyssey', 'super mario'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/8/8d/Super_Mario_Odyssey.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/8/8d/Super_Mario_Odyssey.jpg',
      storeUrl:
        'https://www.nintendo.com/us/store/products/super-mario-odyssey-switch/',
    },
    {
      id: 'switch-mario-wonder',
      title: 'Super Mario Bros. Wonder',
      aliases: ['mario wonder', 'super mario wonder'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/8/87/Super_Mario_Bros_Wonder_cover_art.png',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/8/87/Super_Mario_Bros_Wonder_cover_art.png',
      storeUrl:
        'https://www.nintendo.com/us/store/products/super-mario-bros-wonder-switch/',
    },
    {
      id: 'switch-smash-ultimate',
      title: 'Super Smash Bros. Ultimate',
      aliases: ['smash ultimate', 'ssbu', 'smash bros ultimate', 'smash bros'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/5/50/Super_Smash_Bros._Ultimate_game_cover.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/5/50/Super_Smash_Bros._Ultimate_game_cover.jpg',
      storeUrl:
        'https://www.nintendo.com/us/store/products/super-smash-bros-ultimate-switch/',
    },
    {
      id: 'switch-mk8d',
      title: 'Mario Kart 8 Deluxe',
      aliases: ['mario kart 8', 'mk8', 'mk8d', 'mario kart switch'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/b/ba/MarioCart8BoxArt.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/b/ba/MarioCart8BoxArt.jpg',
      storeUrl:
        'https://www.nintendo.com/us/store/products/mario-kart-8-deluxe-switch/',
    },
    {
      id: 'switch-pokemon-scarlet',
      title: 'Pokémon Scarlet',
      aliases: ['pokemon scarlet', 'scarlet'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/7/77/Pok%C3%A9mon_Scarlet_box_art.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/7/77/Pok%C3%A9mon_Scarlet_box_art.jpg',
      storeUrl:
        'https://www.nintendo.com/us/store/products/pokemon-scarlet-switch/',
    },
    {
      id: 'switch-pokemon-violet',
      title: 'Pokémon Violet',
      aliases: ['pokemon violet', 'violet'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/93/Pok%C3%A9mon_Violet_box_art.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/93/Pok%C3%A9mon_Violet_box_art.jpg',
      storeUrl:
        'https://www.nintendo.com/us/store/products/pokemon-violet-switch/',
    },
    {
      id: 'switch-pokemon-arceus',
      title: 'Pokémon Legends: Arceus',
      aliases: ['legends arceus', 'pokemon arceus', 'arceus'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/98/Pok%C3%A9mon_Legends_Arceus_cover.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/98/Pok%C3%A9mon_Legends_Arceus_cover.jpg',
      storeUrl:
        'https://www.nintendo.com/us/store/products/pokemon-legends-arceus-switch/',
    },
    {
      id: 'switch-acnh',
      title: 'Animal Crossing: New Horizons',
      aliases: ['animal crossing', 'acnh', 'new horizons'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/1/1f/Animal_Crossing_New_Horizons.jpg',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/1/1f/Animal_Crossing_New_Horizons.jpg',
      storeUrl:
        'https://www.nintendo.com/us/store/products/animal-crossing-new-horizons-switch/',
    },
    {
      id: 'switch-metroid-dread',
      title: 'Metroid Dread',
      aliases: ['metroid dread', 'dread'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/5/57/Metroid_Dread_Box_Art.png',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/5/57/Metroid_Dread_Box_Art.png',
      storeUrl:
        'https://www.nintendo.com/us/store/products/metroid-dread-switch/',
    },
    {
      id: 'switch-kirby-forgotten',
      title: 'Kirby and the Forgotten Land',
      aliases: ['kirby forgotten land', 'kirby'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/9c/Kirby_and_the_Forgotten_Land.png',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/9c/Kirby_and_the_Forgotten_Land.png',
      storeUrl:
        'https://www.nintendo.com/us/store/products/kirby-and-the-forgotten-land-switch/',
    },
    {
      id: 'switch-splatoon-3',
      title: 'Splatoon 3',
      aliases: ['splatoon 3', 'splatoon'],
      platform: 'Nintendo Switch',
      source: 'nintendo',
      coverUrl:
        'https://upload.wikimedia.org/wikipedia/en/3/32/Splatoon_3_cover_art.png',
      headerUrl:
        'https://upload.wikimedia.org/wikipedia/en/3/32/Splatoon_3_cover_art.png',
      storeUrl:
        'https://www.nintendo.com/us/store/products/splatoon-3-switch/',
    },
  ];

  async search(query: string, filterPlatform?: string): Promise<GameSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const scoredGames: Array<{ game: CuratedGame; score: number }> = [];

    for (const game of this.catalog) {
      // Filtrar plataforma si no es 'all'
      if (filterPlatform && filterPlatform !== 'all') {
        const normFilter = filterPlatform.toLowerCase();
        if (
          !game.platform.toLowerCase().includes(normFilter) &&
          !game.source.toLowerCase().includes(normFilter)
        ) {
          continue;
        }
      }

      const score = calculateMatchScore(query, game.title, game.aliases);
      if (score > 120) {
        scoredGames.push({ game, score });
      }
    }

    // Ordenar de mayor a menor relevancia
    scoredGames.sort((a, b) => b.score - a.score);

    return scoredGames.slice(0, 10).map(({ game }) => ({
      id: game.id,
      title: game.title,
      platform: game.platform,
      coverUrl: game.coverUrl,
      headerUrl: game.headerUrl || game.coverUrl,
      tinyImage: game.coverUrl,
      source: game.source,
      storeUrl: game.storeUrl,
      launcherUri: game.launcherUri,
      platforms: {
        windows: game.platform !== 'PlayStation 5' && game.platform !== 'Nintendo Switch',
      },
    }));
  }

  async getCover(title: string): Promise<string | null> {
    if (!title || title.trim().length === 0) return null;

    let bestGame: CuratedGame | null = null;
    let bestScore = 0;

    for (const game of this.catalog) {
      const score = calculateMatchScore(title, game.title, game.aliases);
      if (score > bestScore) {
        bestScore = score;
        bestGame = game;
      }
    }

    if (bestScore >= 200 && bestGame) {
      return bestGame.coverUrl;
    }
    return null;
  }
}

