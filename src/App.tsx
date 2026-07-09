import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  Train,
  MapPin,
  Clock,
  RefreshCw,
  Radio,
  AlertCircle,
  TrainFront,
  ChevronRight,
  Camera,
  Users,
  TrendingUp,
  Zap,
  Globe,
  WifiOff
} from 'lucide-react';
import { translations, type Language } from './lib/i18n';
import type { SocialPost } from './lib/enoden-types';
import { fetchEnodenSchedule, formatScheduleAsSocialPost } from './lib/enoden-social';

// Station data for the Enoden line
const STATIONS = [
  { id: 1, name: '藤沢', nameEn: 'Fujisawa', km: 0.0, terminal: true },
  { id: 2, name: '石上', nameEn: 'Ishigami', km: 0.6 },
  { id: 3, name: '柳小路', nameEn: 'Yanagikōji', km: 1.2 },
  { id: 4, name: '鵠沼', nameEn: 'Kugenuma', km: 1.9 },
  { id: 5, name: '湘南海岸公園', nameEn: 'Shōnankaigankōen', km: 2.7 },
  { id: 6, name: '江ノ島', nameEn: 'Enoshima', km: 3.3 },
  { id: 7, name: '腰越', nameEn: 'Koshigoe', km: 4.4 },
  { id: 8, name: '鎌倉高校前', nameEn: 'Kamakurakōkōmae', km: 5.2 },
  { id: 9, name: '七里ヶ浜', nameEn: 'Shichirigahama', km: 5.8 },
  { id: 10, name: '稲村ヶ崎', nameEn: 'Inamuragasaki', km: 6.5 },
  { id: 11, name: '極楽寺', nameEn: 'Gokurakuji', km: 7.2 },
  { id: 12, name: '長谷', nameEn: 'Hase', km: 8.0 },
  { id: 13, name: '由比ヶ浜', nameEn: 'Yuigahama', km: 8.7 },
  { id: 14, name: '和田塚', nameEn: 'Wadazuka', km: 9.3 },
  { id: 15, name: '鎌倉', nameEn: 'Kamakura', km: 10.0, terminal: true }
];

// Language context
const LanguageContext = createContext<{
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations.ja;
}>({
  lang: 'ja',
  setLang: () => {},
  t: translations.ja
});

function useTranslation() {
  return useContext(LanguageContext);
}

interface TrainPosition {
  id: number;
  formation: string;
  formation2?: string;
  special?: string;
  position: number;
  direction: 'inbound' | 'outbound';
  status: 'running' | 'stopped' | 'off';
  serviceNumber: string;
  lastUpdate: Date;
}

// Fetch official Enoden position data
const ENODEN_LOCATION_URL = 'https://www.enoden-location.jp/?mode=1';

interface OfficialTrainData {
  no: number;
  dest: string;
  pos: number;
  type: string;
  delay: number;
}

async function fetchOfficialData(): Promise<{ success: boolean; data?: OfficialTrainData[]; error?: string }> {
  try {
    const response = await fetch(ENODEN_LOCATION_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Parse formation text from social posts


function LanguageToggle() {
  const { lang, setLang } = useTranslation();

  return (
    <button
      onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-medium"
    >
      <Globe className="w-4 h-4" />
      <span>{lang === 'ja' ? 'EN' : '日本語'}</span>
    </button>
  );
}

function TrainCard({ train, index }: { train: TrainPosition; index: number }) {
  const { t, lang } = useTranslation();
  const isRunning = train.status === 'running';
  const currentStation = STATIONS[train.position - 1];

  return (
    <div
      className={`card-hover bg-white rounded-xl shadow-md overflow-hidden animate-slide-in ${
        train.status === 'off' ? 'opacity-60' : ''
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="bg-gradient-to-r from-[#1a5f4a] to-[#2d8f6f] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-lg">[{train.id}]</span>
          </div>
          <div>
            <div className="text-white/80 text-xs">{t.trainNumber}</div>
            <div className="text-white font-semibold">
              {train.serviceNumber || '---'}
            </div>
          </div>
        </div>
        <div className={`status-badge ${isRunning ? 'status-running' : train.status === 'stopped' ? 'status-stopped' : 'status-off'}`}>
          {train.status === 'running' ? t.statusRunning : train.status === 'stopped' ? t.statusStopped : t.statusOff}
        </div>
      </div>

      <div className="p-4">
        <div className="train-formation text-sm text-gray-700 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {train.formation ? (
              <>
                <span className="formation-tag formation-N">
                  {train.formation}
                  {train.special && (
                    <span className="ml-1 text-xs opacity-80">({train.special})</span>
                  )}
                </span>
                {train.formation2 && (
                  <>
                    <span className="text-gray-400">+</span>
                    <span className="formation-tag formation-R">
                      {train.formation2}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-gray-400 text-xs">{t.noFormationInfo}</span>
            )}
          </div>
        </div>

        {isRunning && currentStation && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1a5f4a]" />
              <span className="font-medium text-gray-800">
                {lang === 'ja' ? currentStation.name : currentStation.nameEn}
              </span>
              {lang === 'ja' && (
                <span className="text-gray-400 text-xs">{currentStation.nameEn}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <ChevronRight
                className={`w-4 h-4 ${
                  train.direction === 'outbound' ? 'text-[#d97757] rotate-0' : 'text-[#4a90a4] rotate-180'
                }`}
              />
              <span className="text-xs text-gray-500">
                {train.direction === 'outbound' ? t.toKamakura : t.toFujisawa}
              </span>
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {train.lastUpdate.toLocaleTimeString(lang === 'ja' ? 'ja-JP' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
              {' '}{t.updated}
            </span>
          </div>
          {isRunning && (
            <div className="animate-train">
              <TrainFront className="w-5 h-5 text-[#1a5f4a]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LineMap({ trains }: { trains: TrainPosition[] }) {
  const { t, lang } = useTranslation();
  const runningTrains = trains.filter(t => t.status === 'running');

  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#1a5f4a]" />
          <h3 className="font-semibold text-gray-800">{t.lineMap}</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#d97757]" />
            <span>{t.toFujisawa}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#4a90a4]" />
            <span>{t.toKamakura}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="track-line w-full rounded-full" />

        <div className="flex justify-between mt-2">
          {STATIONS.map((station, idx) => {
            const trainAtStation = runningTrains.find(t => t.position === station.id);
            const isTerminal = station.terminal;

            return (
              <div
                key={station.id}
                className="relative flex flex-col items-center"
                style={{
                  left: `${(idx / (STATIONS.length - 1)) * 100}%`,
                  position: idx === 0 || idx === STATIONS.length - 1 ? 'absolute' : 'relative'
                }}
              >
                {trainAtStation && (
                  <div
                    className={`absolute -top-5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse-slow ${
                      trainAtStation.direction === 'outbound'
                        ? 'bg-[#d97757]'
                        : 'bg-[#4a90a4]'
                    }`}
                  >
                    {trainAtStation.id}
                  </div>
                )}
                <div className={isTerminal ? 'terminal-dot' : 'station-dot'} />
                <div className="mt-1 text-center">
                  <div className={`text-xs ${isTerminal ? 'font-semibold text-[#d97757]' : 'text-gray-600'}`}>
                    {lang === 'ja' ? station.name : station.nameEn}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between mt-6 text-xs text-gray-400">
          <span>{lang === 'ja' ? '藤沢 0.0km' : 'Fujisawa 0.0km'}</span>
          <span>{lang === 'ja' ? '鎌倉 10.0km' : 'Kamakura 10.0km'}</span>
        </div>
      </div>
    </div>
  );
}

function SocialFeed({ posts }: { posts: SocialPost[] }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-[#4a90a4] to-[#3a7a94] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">{t.socialFeedTitle}</span>
        </div>
        <div className="flex items-center gap-1 text-white/80 text-xs">
          <Users className="w-4 h-4" />
          <span>{t.realtime}</span>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto scrollbar-thin">
        {posts.map((post, idx) => (
          <div key={post.id} className="p-4 animate-slide-in" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-medium text-[#4a90a4]">{post.author}</span>
              <span className="text-xs text-gray-400">
                {post.timestamp.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-3 overflow-x-auto">
              {post.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBar({ lastUpdate, onRefresh, isRefreshing, isOffline }: {
  lastUpdate: Date;
  onRefresh: () => void;
  isRefreshing: boolean;
  isOffline?: boolean;
}) {
  const { t, lang } = useTranslation();
  const hour = new Date().getHours();
  const isOperating = hour >= 5 && hour < 23;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOperating ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {isOperating ? t.operatingHours : t.outsideOperatingHours}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>
            {t.lastUpdate}: {lastUpdate.toLocaleTimeString(lang === 'ja' ? 'ja-JP' : 'en-US')}
          </span>
        </div>
        {isOffline && (
          <div className="flex items-center gap-1 text-sm text-amber-600">
            <WifiOff className="w-4 h-4" />
            <span>{t.offlineMode}</span>
          </div>
        )}
      </div>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a5f4a] text-white text-sm font-medium hover:bg-[#2d8f6f] transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>{t.refresh}</span>
      </button>
    </div>
  );
}

function FormationLegend() {
  const { t } = useTranslation();
  const specialTrains = [
    { name: t.specialTrains.onePiece, formation: '1101F', color: 'bg-blue-100 text-blue-700' },
    { name: t.specialTrains.kamakurato, formation: '2002F', color: 'bg-pink-100 text-pink-700' },
    { name: t.specialTrains.cocaCola, formation: '21F', color: 'bg-red-100 text-red-700' },
    { name: t.specialTrains.randen, formation: '1002F', color: 'bg-purple-100 text-purple-700' },
    { name: t.specialTrains.new700, formation: '701F/702F', color: 'bg-green-100 text-green-700' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-5 h-5 text-[#1a5f4a]" />
        <h3 className="font-semibold text-gray-800">{t.specialFormations}</h3>
      </div>
      <div className="space-y-2">
        {specialTrains.map((train, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${train.color}`}>
              {train.name}
            </span>
            <span className="train-formation text-xs text-gray-600">{train.formation}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('enoden-lang');
    return (saved === 'en' || saved === 'ja') ? saved : 'ja';
  });
  const t = translations[lang];

  const [trains, setTrains] = useState<TrainPosition[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  // const [dataSource, setDataSource] = useState<'official' | 'mock'>('mock');

  useEffect(() => {
    localStorage.setItem('enoden-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    setIsOffline(false);

    try {
      // Try official Enoden API
      const result = await fetchOfficialData();

      if (result.success && result.data && result.data.length > 0) {
        // Map official data to our format
        const mappedTrains: TrainPosition[] = result.data.map((train) => {
          // Find the station based on position
          const stationId = Math.min(Math.max(train.pos, 1), 15);

          return {
            id: train.no,
            formation: '',
            position: stationId,
            direction: train.dest.includes('藤') || train.dest.includes('Fuji') ? 'inbound' : 'outbound',
            status: 'running',
            serviceNumber: train.type,
            lastUpdate: new Date()
          };
        });

        setTrains(mappedTrains);
        // setDataSource('official');
      } else {
        // Fall back to mock data
        // setTrains(generateMockData());
        // setDataSource('mock');
        if (result.error) {
          console.warn('Official API unavailable:', result.error);
          setIsOffline(true);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      // setTrains(generateMockData());
      // setDataSource('mock');
      setIsOffline(true);
    }

    try {
      const scheduleResult = await fetchEnodenSchedule();
      if (scheduleResult.success) {
        const post = formatScheduleAsSocialPost(scheduleResult.data);
        setSocialPosts((prev) => [post, ...prev].slice(0, 20));
      } else {
        console.warn('Enoden schedule feed unavailable:', scheduleResult.error);
      }
    } catch (error) {
      console.warn('Enoden schedule feed error:', error);
    }

    setLastUpdate(new Date());
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    // Initial data load
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const runningCount = trains.filter(t => t.status === 'running').length;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <div className="min-h-screen pb-8">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#1a5f4a] to-[#2d8f6f] text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Train className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{t.title}</h1>
                  <p className="text-white/80 text-sm">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <LanguageToggle />
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{runningCount}</div>
                    <div className="text-xs text-white/70">{t.runningTrains}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">6</div>
                    <div className="text-xs text-white/70">{t.formations}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">15</div>
                    <div className="text-xs text-white/70">{t.stations}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
          {/* Status Bar */}
          <StatusBar
            lastUpdate={lastUpdate}
            onRefresh={fetchData}
            isRefreshing={isRefreshing}
            isOffline={isOffline}
          />

          {/* Line Map */}
          <LineMap trains={trains} />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Train Cards */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <TrainFront className="w-5 h-5 text-[#1a5f4a]" />
                <h2 className="font-semibold text-gray-800">{t.trainOperations}</h2>
                <span className="text-xs text-gray-500 ml-auto">
                  {t.operationNumbers}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {trains.map((train, idx) => (
                  <TrainCard key={train.id} train={train} index={idx} />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <SocialFeed posts={socialPosts} />
              <FormationLegend />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-4 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{runningCount}/6</div>
                  <div className="text-xs text-gray-500">{t.trainsRunning}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">10km</div>
                  <div className="text-xs text-gray-500">{t.lineDistance}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{lang === 'ja' ? '~12分' : '~12 min'}</div>
                  <div className="text-xs text-gray-500">{t.serviceInterval}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{lang === 'ja' ? '約35分' : '~35 min'}</div>
                  <div className="text-xs text-gray-500">{t.fullTravelTime}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">{t.dataSourceTitle}</p>
              <p className="text-amber-700">
                {t.dataSourceText}
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 py-4 border-t border-gray-200 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>{t.footerText}</p>
            <p className="text-xs mt-1">
              {t.autoRefreshNote}
            </p>
          </div>
        </footer>
      </div>
    </LanguageContext.Provider>
  );
}

export default App;
