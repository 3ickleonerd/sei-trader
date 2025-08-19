const tokensRaw = [
  {
    symbol: "WSEI",
    name: "Wrapped SEI",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7/logo.png",
    cg_id: "sei-network",
  },
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x0555E30da8f98308EdB960aa94C0Db47230d2B9c/logo.png",
    cg_id: "wrapped-bitcoin",
  },
  {
    symbol: "iSEI",
    name: "iSEI",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x5Cf6826140C1C56Ff49C808A1A75407Cd1DF9423/logo.png",
    cg_id: "silo-staked-sei",
  },
  {
    symbol: "WETH",
    name: "Wrapped ETH",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x160345fC359604fC6e70E3c5fAcbdE5F7A9342d8/logo.png",
    cg_id: "weth",
  },
  {
    symbol: "SEIYAN",
    name: "SEIYAN",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x5f0E07dFeE5832Faa00c63F2D33A0D79150E8598/logo.png",
    cg_id: "seiyan",
  },
  {
    symbol: "FXS",
    name: "Frax Share",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x64445f0aecC51E94aD52d8AC56b7190e764E561a/logo.png",
    cg_id: "frax-share",
  },
  {
    symbol: "ROCK",
    name: "Rock",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x83c82f0f959aD3eff528eE513b43808Aa53f4B37/logo.png",
    cg_id: "rock-2",
  },
  {
    symbol: "MILLI",
    name: "MILLI",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x95597EB8D227a7c4B4f5E807a815C5178eE6dBE1/logo.png",
    cg_id: "milli-coin",
  },
  {
    symbol: "POPO",
    name: "Popo The Cat",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xC18b6a15FB0ceaf5eb18696EeFCb5bc7b9107149/logo.png",
    cg_id: "popo-the-cat",
  },
  {
    symbol: "BALLZ",
    name: "SeiBallz",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xc6bc81a0e287cc8103cc002147a9d76cae4cd6e5/logo.png",
    cg_id: null,
  },
  {
    symbol: "SPEX",
    name: "Seipex Credits",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x3A0A7a3cA25C17D15E8d51332fb25BFEA274d107/logo.png",
    cg_id: "speciex",
  },
  {
    symbol: "SeiPepe",
    name: "SeiPepe",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x17fe1101aF2dAB1aF0317d1ad1BD66cD06Da4B5c/logo.png",
    cg_id: null,
  },
  {
    symbol: "GOKU",
    name: "Gokucity Token",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x019EA1347BD9bc912c0221d24983a74E9386B794/logo.png",
    cg_id: "goku",
  },
  {
    symbol: "OS",
    name: "OpenSei",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x99B85E9dFFfed176E46a3bE009ab9f9FE6AE59ed/logo.png",
    cg_id: null,
  },
  {
    symbol: "NINJA",
    name: "$NINJA",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x6B92994f5d5D7D36608BDeD50724282F1E58FBB1/logo.png",
    cg_id: "ninja-protocol",
  },
  {
    symbol: "RED",
    name: "Red",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xD049e189ACC1873BCa8c0a314d6B26835684Fb89/logo.png",
    cg_id: "red-token",
  },
  {
    symbol: "JOG",
    name: "JOG",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x49d1bBfaf4038D5E53124aEdB6809CEDcA3D28A5/logo.png",
    cg_id: null,
  },
  {
    symbol: "FROY",
    name: "F you Roy",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x9134d733AaC991b96E899af657C717276A627E32/logo.png",
    cg_id: null,
  },
  {
    symbol: "SEIYUN",
    name: "SEIYUN COIN",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xECf7f1EFC9620A911339619C91c9FA0f71e0600E/logo.png",
    cg_id: null,
  },
  {
    symbol: "JAYJEO",
    name: "jay jeo",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xf5020DC8eC5e0ef8869Ecc3044933356650b61Cf/logo.png",
    cg_id: null,
  },
  {
    symbol: "REX",
    name: "INSPECTOR",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x6291148AE49e0f0d847bB97C4E060E49D87638bA/logo.png",
    cg_id: "etherex",
  },
  {
    symbol: "CHUCK",
    name: "CHUCKCOIN",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xb8D41DB605A3258010D531429E85b13C7abdE579/logo.png",
    cg_id: "chuck",
  },
  {
    symbol: "$gonad",
    name: "gonad",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xd78BE621436e69C81E4d0e9f29bE14C5EC51E6Ae/logo.png",
    cg_id: null,
  },
  {
    symbol: "USA",
    name: "Sei Usagi",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x5c85726f71aFB7e26d769fB559Ce0168CE1F8f4E/logo.png",
    cg_id: "american-coin",
  },
  {
    symbol: "$SEIS",
    name: "SEIS AI",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xE94a7c93A00B12E803166D8e355F617B920DD48e/logo.png",
    cg_id: null,
  },
  {
    symbol: "SeiWhale",
    name: "SeiWhale",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x67DA7010C6c231AD620E3940e707adB6c1a08f23/logo.png",
    cg_id: null,
  },
  {
    symbol: "SAKE",
    name: "SAKEINU",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xe85dC0CCECa105755753Fef452C091dEF5324138/logo.png",
    cg_id: "sake-token",
  },
  {
    symbol: "BOOBLE",
    name: "BOOBLE",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xF20903d034B12a7266055FE97cEBdB9199Ec6925/logo.png",
    cg_id: null,
  },
  {
    symbol: "Pepei",
    name: "Pepei",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x9C367a272f8E318D10118C6367fD69DEf30e430E/logo.png",
    cg_id: null,
  },
  {
    symbol: "HOOD",
    name: "DogWithHoodie",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xB629b01A0b3Be5fDab174464507B37C67c3c6084/logo.png",
    cg_id: "hood-cat",
  },
  {
    symbol: "BITCH",
    name: "Sei Bitch",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x646E178a05B4Cb4f2b36D04Bd02767CFeed730CA/logo.png",
    cg_id: null,
  },
  {
    symbol: "SEIRO",
    name: "Seiro",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xC66a9B784C0FE8c2Ef7dDaBFacCC6c37b15e73AA/logo.png",
    cg_id: null,
  },
  {
    symbol: "COOK",
    name: "CookOnSEI",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x69e48cE9CF965aCc1DE2aD5ad2FdbC3Bdb51509b/logo.png",
    cg_id: "cook",
  },
  {
    symbol: "What?",
    name: "Sei What?",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x597f3D8B4e826806915C9158fb0D700367117D7f/logo.png",
    cg_id: null,
  },
  {
    symbol: "SENSEI",
    name: "Master",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x9b31ad7d1eE5a37c64a5972275C5F09fFfbC2C6f/logo.png",
    cg_id: null,
  },
  {
    symbol: "SEITAN",
    name: "S8N",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xDF3D7DD2848f491645974215474c566E79F2e538/logo.png",
    cg_id: null,
  },
  {
    symbol: "SUPERSEIZ",
    name: "Burger",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xF63980e3818607c0797e994cfD34c1c592968469/logo.png",
    cg_id: null,
  },
  {
    symbol: "VROS",
    name: "Mushvro",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x7950C5Fbd48F6BC3555D1dAE2C03e0Ea5Eb987dc/logo.png",
    cg_id: null,
  },
  {
    symbol: "LESS",
    name: "Sei Less",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x8c5529ad032c48bc6413Df8e8dC83D26Dc680079/logo.png",
    cg_id: null,
  },
  {
    symbol: "SHISHO",
    name: "LORD SHISHO",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xd0C7EdF2109bE009364ac3DB76C6fE8a75728657/logo.png",
    cg_id: null,
  },
  {
    symbol: "CHIPS",
    name: "CHIP$ on SEI",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xBd82f3bfE1dF0c84faEC88a22EbC34C9A86595dc/logo.png",
    cg_id: "chips-2",
  },
  {
    symbol: "SHENRN",
    name: "SHENRON",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x0DD9e6A6AEb91f1e3596F69d5443b6ca2e864896/logo.png",
    cg_id: null,
  },
  {
    symbol: "YOSHI",
    name: "Yoshi",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x40ff962cc119AA9fB5380D316050986805e1a681/logo.png",
    cg_id: "yoshi-exchange",
  },
  {
    symbol: "WILSON",
    name: "Wilson",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x962Aae191622498BcA205c1c1B73E59aC7d295f2/logo.png",
    cg_id: null,
  },
  {
    symbol: "KOSEI",
    name: "KOSEI 🔴💨",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x57fBA850EfcA7c72c270A252383767D741C3017F/logo.png",
    cg_id: null,
  },
  {
    symbol: "xSEIYAN",
    name: "xSEIYAN",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x9D9b12c69555669966D36596C56061B6Cc0A937D/logo.png",
    cg_id: null,
  },
  {
    symbol: "SBC",
    name: "Seibacca",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x3eA30C06F4BA6f696D3ba4b660C39DA96ed8f686/logo.png",
    cg_id: null,
  },
  {
    symbol: "WAIT",
    name: "WAIT",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x00bc9aF972B5fb3b7fA04827bD3C17d4599BAd8b/logo.png",
    cg_id: "hourglass",
  },
  {
    symbol: "POCHITA",
    name: "POCHITA",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xCF40ACBed3f6307C33bF00680c9eDaE8F7d789fF/logo.png",
    cg_id: "pochita",
  },
  {
    symbol: "Frog",
    name: "Froggy",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xF9BDbF259eCe5ae17e29BF92EB7ABd7B8b465Db9/logo.png",
    cg_id: "frog-3",
  },
  {
    symbol: "TRUMP",
    name: "Official Trump",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xea3910f1C6E687B59835885904A2FD1944B51Ec6/logo.png",
    cg_id: "official-trump",
  },
  {
    symbol: "FISHW",
    name: "Fishwar",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x805679729Df385815C57c24B20f4161BD34B655f/logo.png",
    cg_id: "fishwar",
  },
  {
    symbol: "GGC",
    name: "Grand Gangsta City",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x58E11d8ED38a2061361e90916540c5c32281A380/logo.png",
    cg_id: "grand-gangsta-city",
  },
  {
    symbol: "APO",
    name: "APO",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x5b8203e65aA5Be3F1CF53FD7fa21b91BA4038ECC/logo.png",
    cg_id: "apo",
  },
  {
    symbol: "MAD",
    name: "MAD",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0xC141153C69F28BE65469c98e318872911587ebEc/logo.png",
    cg_id: "mad",
  },
  {
    symbol: "aMSTR",
    name: "aMSTR",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x7D330358F0bE21fEeb751d0622ffeE04E25d7Dfa/logo.png",
    cg_id: null,
  },
  {
    symbol: "RAIIN",
    name: "Raiin",
    imageUrl:
      "https://dzyb4dm7r8k8w.cloudfront.net/prod/logos/0x481FE356DF88169f5F38203Dd7f3C67B7559FDa5/logo.png",
    cg_id: "raiinmaker",
  },
] as const;

export const tokens = tokensRaw.filter((token) => !!token.cg_id);
