export type Language = 'ja' | 'en';

export const translations = {
  ja: {
    // Header
    title: '江ノ電運用ダッシュボード',
    subtitle: 'Enoden Live Tracking Dashboard',
    runningTrains: '運行列車',
    formations: '編成数',
    stations: '駅数',

    // Status
    operatingHours: '運行時間内',
    outsideOperatingHours: '運行時間外 (5:00-23:00)',
    lastUpdate: '最終更新',
    offlineMode: 'オフラインモード',
    refresh: '更新',

    // Line Map
    lineMap: '路線マップ',
    toFujisawa: '藤沢方面',
    toKamakura: '鎌倉方面',

    // Train Cards
    trainNumber: '列車番号',
    statusRunning: '運行中',
    statusStopped: '停車中',
    statusOff: '運用外',
    noFormationInfo: '編成情報なし',
    updated: '更新',
    operationNumbers: '[1]-[6]は運用番号',

    // Train Operations
    trainOperations: '列車運用状況',

    // Social Feed
    socialFeedTitle: '#江ノ電運用 フィード',
    realtime: 'リアルタイム',

    // Formation Legend
    specialFormations: '特別編成一覧',

    // Stats
    trainsRunning: '運行中',
    lineDistance: '路線距離',
    serviceInterval: '運転間隔',
    fullTravelTime: '全区間所要',

    // Info Banner
    dataSourceTitle: 'データソースについて',
    dataSourceText: '列車位置情報は江ノ島電鉄公式サイトのデータを基にしています。#江ノ電運用ハッシュタグの投稿は有志の方々によるものです。実際の運行状況は公式サイトでご確認ください。',

    // Footer
    footerText: '江ノ電運用ダッシュボード - Unofficial fan project',
    autoRefreshNote: 'データは自動更新されます (30秒ごと)',

    // Special trains
    specialTrains: {
      onePiece: 'ONE PIECE',
      kamakurato: 'カマクラータ',
      cocaCola: 'コカコーラ',
      randen: '嵐電',
      new700: '700形 NEW'
    }
  },
  en: {
    // Header
    title: 'Enoden Operations Dashboard',
    subtitle: '江ノ電運用ダッシュボード',
    runningTrains: 'Running',
    formations: 'Formations',
    stations: 'Stations',

    // Status
    operatingHours: 'Within operating hours',
    outsideOperatingHours: 'Outside operating hours (5:00-23:00)',
    lastUpdate: 'Last update',
    offlineMode: 'Offline mode',
    refresh: 'Refresh',

    // Line Map
    lineMap: 'Line Map',
    toFujisawa: 'To Fujisawa',
    toKamakura: 'To Kamakura',

    // Train Cards
    trainNumber: 'Train No.',
    statusRunning: 'Running',
    statusStopped: 'Stopped',
    statusOff: 'Off duty',
    noFormationInfo: 'No formation info',
    updated: 'updated',
    operationNumbers: '[1]-[6] are operation numbers',

    // Train Operations
    trainOperations: 'Train Operations',

    // Social Feed
    socialFeedTitle: '#江ノ電運用 Feed',
    realtime: 'Real-time',

    // Formation Legend
    specialFormations: 'Special Formations',

    // Stats
    trainsRunning: 'Running',
    lineDistance: 'Line Distance',
    serviceInterval: 'Service Interval',
    fullTravelTime: 'Full Journey',

    // Info Banner
    dataSourceTitle: 'About Data Sources',
    dataSourceText: 'Train position data is based on the official Enoden website. #江ノ電運用 posts are contributed by volunteers. Please check the official website for actual operating conditions.',

    // Footer
    footerText: 'Enoden Operations Dashboard - Unofficial fan project',
    autoRefreshNote: 'Data refreshes automatically (every 30 seconds)',

    // Special trains
    specialTrains: {
      onePiece: 'ONE PIECE',
      kamakurato: 'Kamakurato',
      cocaCola: 'Coca-Cola',
      randen: 'Randen',
      new700: '700 Series NEW'
    }
  }
};

export type TranslationKey = keyof typeof translations.ja;
