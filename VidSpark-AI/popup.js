const BACKEND_URL = 'https://vidspark-ai-production-9ac7.up.railway.app/api';

/* ══════════════════════════════════════════════════════════════
   i18n du popup — 14 langues.
   Le popup est un document séparé : il n'a pas accès au dictionnaire de
   content.js. Il suit la langue choisie dans le panneau (clé de stockage
   `echoLanguage`), sinon celle du navigateur, sinon l'anglais.
══════════════════════════════════════════════════════════════ */
const P_I18N = {
 fr:{p_tag:"Intelligence SEO YouTube",p_choose:"Choisis ton forfait, ou connecte l'extension à ton compte VidSpark.",p_plans:"Forfaits",p_connect:"Connecter",p_form_info:"Entre l'ID et le code secret reçus après ton inscription.",p_id:"ID d'activation",p_secret:"Code secret",p_activate:"Activer",p_back:"Retour",p_active_t:"Extension activée",p_active_plan:"Forfait en cours",p_days_left:"restants",p_active_info:"Tu peux analyser tes vidéos YouTube. L'extension reste bloquée sur les chaînes non autorisées.",p_new:"Déconnexion",p_need_both:"Entre l'ID et le code secret.",p_checking:"Vérification…",p_verifying:"Vérification en cours…",p_ok:"Extension activée !",p_err:"Erreur",p_net_err:"Erreur réseau",p_expired:"Expiré",p_day:"jour",p_days:"jours",p_tools:"Outils",p_account:"Compte",p_dashboard:"Tableau de bord",p_billing:"Mon abonnement",p_support:"Support",p_open_yt:"Ouvrir sur YouTube",p_sec_coach:"Coach",p_sec_analyser:"Analyser",p_sec_creer:"Créer",p_sec_studio:"Studio",p_sec_publier:"Publier",p_sec_suivi:"Suivi",p_sec_croissance:"Croissance",p_connecting:"Connexion à VidSpark…",p_connecting_sub:"Ouverture du site dans un nouvel onglet…",p_connect_err:"Impossible de terminer la connexion.",p_retry:"🔄 Réessayer",p_not_detected:"Extension non détectée.",p_not_detected_sub:"Vérifie que VidSpark AI est bien installée et active.",p_use_code:"Utiliser un code de connexion",p_code_label:"Code de connexion",p_validate:"✅ Valider",p_code_invalid:"Code invalide ou expiré.",p_code_needed:"Entre le code de connexion."},
 en:{p_tag:"YouTube SEO intelligence",p_choose:"Pick your plan, or connect the extension to your VidSpark account.",p_plans:"Plans",p_connect:"Connect",p_form_info:"Enter the ID and secret code you received after signing up.",p_id:"Activation ID",p_secret:"Secret code",p_activate:"Activate",p_back:"Back",p_active_t:"Extension activated",p_active_plan:"Current plan",p_days_left:"remaining",p_active_info:"You can analyze your YouTube videos. The extension stays blocked on channels that are not allowed.",p_new:"Disconnect",p_need_both:"Enter the ID and the secret code.",p_checking:"Checking…",p_verifying:"Checking…",p_ok:"Extension activated!",p_err:"Error",p_net_err:"Network error",p_expired:"Expired",p_day:"day",p_days:"days",p_tools:"Tools",p_account:"Account",p_dashboard:"Dashboard",p_billing:"My subscription",p_support:"Support",p_open_yt:"Open on YouTube",p_sec_coach:"Coach",p_sec_analyser:"Analyze",p_sec_creer:"Create",p_sec_studio:"Studio",p_sec_publier:"Publish",p_sec_suivi:"Track",p_sec_croissance:"Growth",p_connecting:"Connecting to VidSpark…",p_connecting_sub:"Opening the site in a new tab…",p_connect_err:"Could not complete the connection.",p_retry:"🔄 Retry",p_not_detected:"Extension not detected.",p_not_detected_sub:"Make sure VidSpark AI is installed and enabled.",p_use_code:"Use a connection code",p_code_label:"Connection code",p_validate:"✅ Validate",p_code_invalid:"Invalid or expired code.",p_code_needed:"Enter the connection code."},
 ar:{p_tag:"ذكاء SEO ليوتيوب",p_choose:"اختر خطتك، أو فعّل الإضافة بمعرّفك ورمزك السري.",p_plans:"الخطط",p_connect:"اتصال",p_form_info:"أدخل المعرّف والرمز السري الذي وصلك بعد التسجيل.",p_id:"معرّف التفعيل",p_secret:"الرمز السري",p_activate:"تفعيل",p_back:"رجوع",p_active_t:"تم تفعيل الإضافة",p_active_plan:"الخطة الحالية",p_days_left:"متبقية",p_active_info:"يمكنك تحليل فيديوهاتك على يوتيوب. تبقى الإضافة معطّلة على القنوات غير المصرّح بها.",p_new:"تفعيل جديد",p_need_both:"أدخل المعرّف والرمز السري.",p_checking:"جارٍ التحقق…",p_verifying:"جارٍ التحقق…",p_ok:"تم تفعيل الإضافة!",p_err:"خطأ",p_net_err:"خطأ في الشبكة",p_expired:"منتهي",p_day:"يوم",p_days:"أيام",p_tools:"الأدوات",p_account:"الحساب",p_dashboard:"لوحة التحكم",p_billing:"اشتراكي",p_support:"الدعم",p_open_yt:"افتح على يوتيوب",p_sec_coach:"المدرّب",p_sec_analyser:"تحليل",p_sec_creer:"إنشاء",p_sec_studio:"الاستوديو",p_sec_publier:"نشر",p_sec_suivi:"تتبع",p_sec_croissance:"النمو"},
 es:{p_tag:"Inteligencia SEO para YouTube",p_choose:"Elige tu plan o activa la extensión con tu ID y tu código secreto.",p_plans:"Planes",p_connect:"Conectar",p_form_info:"Introduce el ID y el código secreto que recibiste al registrarte.",p_id:"ID de activación",p_secret:"Código secreto",p_activate:"Activar",p_back:"Volver",p_active_t:"Extensión activada",p_active_plan:"Plan actual",p_days_left:"restantes",p_active_info:"Puedes analizar tus vídeos de YouTube. La extensión sigue bloqueada en los canales no autorizados.",p_new:"Nueva activación",p_need_both:"Introduce el ID y el código secreto.",p_checking:"Comprobando…",p_verifying:"Comprobando…",p_ok:"¡Extensión activada!",p_err:"Error",p_net_err:"Error de red",p_expired:"Caducado",p_day:"día",p_days:"días",p_tools:"Herramientas",p_account:"Cuenta",p_dashboard:"Panel",p_billing:"Mi suscripción",p_support:"Soporte",p_open_yt:"Abrir en YouTube",p_sec_coach:"Coach",p_sec_analyser:"Analizar",p_sec_creer:"Crear",p_sec_studio:"Estudio",p_sec_publier:"Publicar",p_sec_suivi:"Seguimiento",p_sec_croissance:"Crecimiento"},
 pt:{p_tag:"Inteligência SEO para YouTube",p_choose:"Escolhe o teu plano ou ativa a extensão com o teu ID e código secreto.",p_plans:"Planos",p_connect:"Ligar",p_form_info:"Introduz o ID e o código secreto que recebeste após o registo.",p_id:"ID de ativação",p_secret:"Código secreto",p_activate:"Ativar",p_back:"Voltar",p_active_t:"Extensão ativada",p_active_plan:"Plano atual",p_days_left:"restantes",p_active_info:"Podes analisar os teus vídeos do YouTube. A extensão continua bloqueada nos canais não autorizados.",p_new:"Nova ativação",p_need_both:"Introduz o ID e o código secreto.",p_checking:"A verificar…",p_verifying:"A verificar…",p_ok:"Extensão ativada!",p_err:"Erro",p_net_err:"Erro de rede",p_expired:"Expirado",p_day:"dia",p_days:"dias",p_tools:"Ferramentas",p_account:"Conta",p_dashboard:"Painel",p_billing:"Minha assinatura",p_support:"Suporte",p_open_yt:"Abrir no YouTube",p_sec_coach:"Coach",p_sec_analyser:"Analisar",p_sec_creer:"Criar",p_sec_studio:"Estúdio",p_sec_publier:"Publicar",p_sec_suivi:"Acompanhamento",p_sec_croissance:"Crescimento"},
 de:{p_tag:"YouTube-SEO-Intelligenz",p_choose:"Wähle deinen Tarif oder aktiviere die Erweiterung mit ID und Geheimcode.",p_plans:"Tarife",p_connect:"Verbinden",p_form_info:"Gib die ID und den Geheimcode ein, die du nach der Anmeldung erhalten hast.",p_id:"Aktivierungs-ID",p_secret:"Geheimcode",p_activate:"Aktivieren",p_back:"Zurück",p_active_t:"Erweiterung aktiviert",p_active_plan:"Aktueller Tarif",p_days_left:"übrig",p_active_info:"Du kannst deine YouTube-Videos analysieren. Auf nicht freigegebenen Kanälen bleibt die Erweiterung gesperrt.",p_new:"Neue Aktivierung",p_need_both:"Gib ID und Geheimcode ein.",p_checking:"Prüfung…",p_verifying:"Prüfung läuft…",p_ok:"Erweiterung aktiviert!",p_err:"Fehler",p_net_err:"Netzwerkfehler",p_expired:"Abgelaufen",p_day:"Tag",p_days:"Tage",p_tools:"Werkzeuge",p_account:"Konto",p_dashboard:"Übersicht",p_billing:"Mein Abo",p_support:"Support",p_open_yt:"Auf YouTube öffnen",p_sec_coach:"Coach",p_sec_analyser:"Analysieren",p_sec_creer:"Erstellen",p_sec_studio:"Studio",p_sec_publier:"Veröffentlichen",p_sec_suivi:"Verfolgung",p_sec_croissance:"Wachstum"},
 it:{p_tag:"Intelligenza SEO per YouTube",p_choose:"Scegli il tuo piano oppure attiva l'estensione con ID e codice segreto.",p_plans:"Piani",p_connect:"Collega",p_form_info:"Inserisci l'ID e il codice segreto ricevuti dopo la registrazione.",p_id:"ID di attivazione",p_secret:"Codice segreto",p_activate:"Attiva",p_back:"Indietro",p_active_t:"Estensione attivata",p_active_plan:"Piano attuale",p_days_left:"rimanenti",p_active_info:"Puoi analizzare i tuoi video YouTube. L'estensione resta bloccata sui canali non autorizzati.",p_new:"Nuova attivazione",p_need_both:"Inserisci ID e codice segreto.",p_checking:"Verifica…",p_verifying:"Verifica in corso…",p_ok:"Estensione attivata!",p_err:"Errore",p_net_err:"Errore di rete",p_expired:"Scaduto",p_day:"giorno",p_days:"giorni",p_tools:"Strumenti",p_account:"Account",p_dashboard:"Pannello",p_billing:"Il mio abbonamento",p_support:"Supporto",p_open_yt:"Apri su YouTube",p_sec_coach:"Coach",p_sec_analyser:"Analizza",p_sec_creer:"Crea",p_sec_studio:"Studio",p_sec_publier:"Pubblica",p_sec_suivi:"Monitoraggio",p_sec_croissance:"Crescita"},
 ru:{p_tag:"SEO-интеллект для YouTube",p_choose:"Выбери тариф или активируй расширение по ID и секретному коду.",p_plans:"Тарифы",p_connect:"Подключить",p_form_info:"Введи ID и секретный код, полученные после регистрации.",p_id:"ID активации",p_secret:"Секретный код",p_activate:"Активировать",p_back:"Назад",p_active_t:"Расширение активировано",p_active_plan:"Текущий тариф",p_days_left:"осталось",p_active_info:"Ты можешь анализировать свои видео на YouTube. На неразрешённых каналах расширение остаётся заблокированным.",p_new:"Новая активация",p_need_both:"Введи ID и секретный код.",p_checking:"Проверка…",p_verifying:"Идёт проверка…",p_ok:"Расширение активировано!",p_err:"Ошибка",p_net_err:"Ошибка сети",p_expired:"Истёк",p_day:"день",p_days:"дней",p_tools:"Инструменты",p_account:"Аккаунт",p_dashboard:"Панель управления",p_billing:"Моя подписка",p_support:"Поддержка",p_open_yt:"Открыть на YouTube",p_sec_coach:"Коуч",p_sec_analyser:"Анализ",p_sec_creer:"Создать",p_sec_studio:"Студия",p_sec_publier:"Опубликовать",p_sec_suivi:"Отслеживание",p_sec_croissance:"Рост"},
 ja:{p_tag:"YouTube SEO インテリジェンス",p_choose:"プランを選ぶか、ID とシークレットコードで拡張機能を有効化してください。",p_plans:"プラン",p_connect:"接続",p_form_info:"登録後に届いた ID とシークレットコードを入力してください。",p_id:"有効化 ID",p_secret:"シークレットコード",p_activate:"有効化",p_back:"戻る",p_active_t:"拡張機能を有効化しました",p_active_plan:"現在のプラン",p_days_left:"残り",p_active_info:"自分の YouTube 動画を分析できます。許可されていないチャンネルでは無効のままです。",p_new:"新しい有効化",p_need_both:"ID とシークレットコードを入力してください。",p_checking:"確認中…",p_verifying:"確認しています…",p_ok:"拡張機能を有効化しました！",p_err:"エラー",p_net_err:"ネットワークエラー",p_expired:"期限切れ",p_day:"日",p_days:"日",p_tools:"ツール",p_account:"アカウント",p_dashboard:"ダッシュボード",p_billing:"マイプラン",p_support:"サポート",p_open_yt:"YouTubeで開く",p_sec_coach:"コーチ",p_sec_analyser:"分析",p_sec_creer:"作成",p_sec_studio:"スタジオ",p_sec_publier:"公開",p_sec_suivi:"トラッキング",p_sec_croissance:"成長"},
 ko:{p_tag:"YouTube SEO 인텔리전스",p_choose:"플랜을 고르거나 ID와 비밀 코드로 확장을 활성화하세요.",p_plans:"플랜",p_connect:"연결",p_form_info:"가입 후 받은 ID와 비밀 코드를 입력하세요.",p_id:"활성화 ID",p_secret:"비밀 코드",p_activate:"활성화",p_back:"뒤로",p_active_t:"확장이 활성화되었습니다",p_active_plan:"현재 플랜",p_days_left:"남음",p_active_info:"내 YouTube 영상을 분석할 수 있습니다. 허용되지 않은 채널에서는 계속 비활성 상태입니다.",p_new:"새 활성화",p_need_both:"ID와 비밀 코드를 입력하세요.",p_checking:"확인 중…",p_verifying:"확인 중…",p_ok:"확장이 활성화되었습니다!",p_err:"오류",p_net_err:"네트워크 오류",p_expired:"만료됨",p_day:"일",p_days:"일",p_tools:"도구",p_account:"계정",p_dashboard:"대시보드",p_billing:"내 구독",p_support:"지원",p_open_yt:"YouTube에서 열기",p_sec_coach:"코치",p_sec_analyser:"분석",p_sec_creer:"만들기",p_sec_studio:"스튜디오",p_sec_publier:"게시",p_sec_suivi:"추적",p_sec_croissance:"성장"},
 hi:{p_tag:"YouTube SEO इंटेलिजेंस",p_choose:"अपना प्लान चुनें, या अपने ID और गुप्त कोड से एक्सटेंशन सक्रिय करें।",p_plans:"प्लान",p_connect:"जोड़ें",p_form_info:"साइन अप के बाद मिला ID और गुप्त कोड डालें।",p_id:"सक्रियण ID",p_secret:"गुप्त कोड",p_activate:"सक्रिय करें",p_back:"वापस",p_active_t:"एक्सटेंशन सक्रिय हुआ",p_active_plan:"वर्तमान प्लान",p_days_left:"शेष",p_active_info:"आप अपने YouTube वीडियो का विश्लेषण कर सकते हैं। अनुमति-रहित चैनलों पर एक्सटेंशन बंद रहता है।",p_new:"नया सक्रियण",p_need_both:"ID और गुप्त कोड डालें।",p_checking:"जाँच…",p_verifying:"जाँच हो रही है…",p_ok:"एक्सटेंशन सक्रिय हुआ!",p_err:"त्रुटि",p_net_err:"नेटवर्क त्रुटि",p_expired:"समाप्त",p_day:"दिन",p_days:"दिन",p_tools:"टूल्स",p_account:"खाता",p_dashboard:"डैशबोर्ड",p_billing:"मेरी सदस्यता",p_support:"सहायता",p_open_yt:"YouTube पर खोलें",p_sec_coach:"कोच",p_sec_analyser:"विश्लेषण",p_sec_creer:"बनाएं",p_sec_studio:"स्टूडियो",p_sec_publier:"प्रकाशित करें",p_sec_suivi:"ट्रैकिंग",p_sec_croissance:"विकास"},
 zh:{p_tag:"YouTube SEO 智能",p_choose:"选择套餐，或用你的 ID 和密钥激活扩展。",p_plans:"套餐",p_connect:"连接",p_form_info:"输入注册后收到的 ID 和密钥。",p_id:"激活 ID",p_secret:"密钥",p_activate:"激活",p_back:"返回",p_active_t:"扩展已激活",p_active_plan:"当前套餐",p_days_left:"剩余",p_active_info:"你可以分析自己的 YouTube 视频。在未授权的频道上扩展仍处于停用状态。",p_new:"重新激活",p_need_both:"请输入 ID 和密钥。",p_checking:"验证中…",p_verifying:"正在验证…",p_ok:"扩展已激活！",p_err:"错误",p_net_err:"网络错误",p_expired:"已过期",p_day:"天",p_days:"天",p_tools:"工具",p_account:"账户",p_dashboard:"仪表盘",p_billing:"我的订阅",p_support:"支持",p_open_yt:"在YouTube中打开",p_sec_coach:"教练",p_sec_analyser:"分析",p_sec_creer:"创建",p_sec_studio:"工作室",p_sec_publier:"发布",p_sec_suivi:"追踪",p_sec_croissance:"增长"},
 tr:{p_tag:"YouTube SEO zekâsı",p_choose:"Planını seç ya da uzantıyı ID ve gizli kodunla etkinleştir.",p_plans:"Planlar",p_connect:"Bağlan",p_form_info:"Kayıttan sonra aldığın ID ve gizli kodu gir.",p_id:"Etkinleştirme ID'si",p_secret:"Gizli kod",p_activate:"Etkinleştir",p_back:"Geri",p_active_t:"Uzantı etkinleştirildi",p_active_plan:"Mevcut plan",p_days_left:"kaldı",p_active_info:"YouTube videolarını analiz edebilirsin. Yetkili olmayan kanallarda uzantı kapalı kalır.",p_new:"Yeni etkinleştirme",p_need_both:"ID ve gizli kodu gir.",p_checking:"Kontrol…",p_verifying:"Kontrol ediliyor…",p_ok:"Uzantı etkinleştirildi!",p_err:"Hata",p_net_err:"Ağ hatası",p_expired:"Süresi doldu",p_day:"gün",p_days:"gün",p_tools:"Araçlar",p_account:"Hesap",p_dashboard:"Kontrol paneli",p_billing:"Aboneliğim",p_support:"Destek",p_open_yt:"YouTube'da aç",p_sec_coach:"Koç",p_sec_analyser:"Analiz",p_sec_creer:"Oluştur",p_sec_studio:"Stüdyo",p_sec_publier:"Yayınla",p_sec_suivi:"Takip",p_sec_croissance:"Büyüme"},
 nl:{p_tag:"YouTube SEO-intelligentie",p_choose:"Kies je plan of activeer de extensie met je ID en geheime code.",p_plans:"Plannen",p_connect:"Verbinden",p_form_info:"Voer de ID en geheime code in die je na aanmelding kreeg.",p_id:"Activatie-ID",p_secret:"Geheime code",p_activate:"Activeren",p_back:"Terug",p_active_t:"Extensie geactiveerd",p_active_plan:"Huidig plan",p_days_left:"resterend",p_active_info:"Je kunt je YouTube-video's analyseren. Op niet-toegestane kanalen blijft de extensie geblokkeerd.",p_new:"Nieuwe activatie",p_need_both:"Voer de ID en de geheime code in.",p_checking:"Controleren…",p_verifying:"Controleren…",p_ok:"Extensie geactiveerd!",p_err:"Fout",p_net_err:"Netwerkfout",p_expired:"Verlopen",p_day:"dag",p_days:"dagen",p_tools:"Tools",p_account:"Account",p_dashboard:"Dashboard",p_billing:"Mijn abonnement",p_support:"Ondersteuning",p_open_yt:"Openen op YouTube",p_sec_coach:"Coach",p_sec_analyser:"Analyseren",p_sec_creer:"Maken",p_sec_studio:"Studio",p_sec_publier:"Publiceren",p_sec_suivi:"Volgen",p_sec_croissance:"Groei"}
};
let pLang = "en";
const P = k => (P_I18N[pLang] && P_I18N[pLang][k]) || P_I18N.en[k] || k;

/* Applique la langue à tout le document (attributs data-i18n) + sens de lecture. */
function applyPopupI18n(){
  document.documentElement.lang = pLang;
  document.documentElement.dir  = pLang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent = P(el.dataset.i18n); });
  inputId.setAttribute("aria-label", P("p_id"));
  inputSecret.setAttribute("aria-label", P("p_secret"));
  renderLauncher();
}

/* ══════════════════════════════════════════════════════════════
   LAUNCHER — écran "activé" : porte d'entrée vers les 7 sections de
   l'application flottante sur YouTube, plus les liens de compte.
   Ne duplique pas l'application principale — un clic ouvre/rejoint l'onglet
   YouTube et lui délègue l'affichage réel (voir content.js : openSection()).
══════════════════════════════════════════════════════════════ */
const SECTIONS = [
  {id:"coach",     icon:"🧠", key:"p_sec_coach"},
  {id:"analyser",  icon:"🔍", key:"p_sec_analyser"},
  {id:"creer",     icon:"✍️", key:"p_sec_creer"},
  {id:"studio",    icon:"🎨", key:"p_sec_studio"},
  {id:"publier",   icon:"🚀", key:"p_sec_publier"},
  {id:"suivi",     icon:"📊", key:"p_sec_suivi"},
  {id:"croissance",icon:"📈", key:"p_sec_croissance"}
];

function renderLauncher(){
  const list = document.getElementById("lpTools");
  if(!list) return; // popup pas encore chargé au premier appel
  list.innerHTML = SECTIONS.map(s=>
    `<button type="button" class="launcher-item" data-section="${s.id}"><span class="ic">${s.icon}</span><span class="t">${P(s.key)}</span><span class="chev">›</span></button>`
  ).join("");
  list.querySelectorAll("[data-section]").forEach(btn=>{
    btn.addEventListener("click", ()=>openOnYouTube(btn.dataset.section));
  });

  chrome.storage.local.get(["userPlan","userAvatar","userName"], (st)=>{
    const plan = st.userPlan || "free";
    const badge = document.getElementById("lpPlanBadge");
    if(badge){ badge.textContent = plan.charAt(0).toUpperCase()+plan.slice(1); badge.className = "plan-badge " + plan; }
    const avImg = document.getElementById("lpAvatarImg");
    const avIcon = document.getElementById("lpAvatarIcon");
    if(avImg && avIcon){
      if(st.userAvatar){ avImg.src = st.userAvatar; avImg.hidden = false; avIcon.hidden = true; }
      else { avImg.hidden = true; avIcon.hidden = false; }
    }
  });
}

/* Rejoint l'onglet YouTube actif s'il y en a un, sinon en ouvre un nouveau —
   la section demandée est livrée par message si le content script est déjà
   là, ou déposée en storage pour être consommée au démarrage du nouvel onglet
   (voir consumePendingSection() côté content.js). */
function openOnYouTube(sectionId){
  chrome.tabs.query({active:true,currentWindow:true},(tabs)=>{
    const tab = tabs && tabs[0];
    const onYouTube = !!(tab && tab.url && /^https:\/\/(www\.)?youtube\.com\//.test(tab.url));
    if(onYouTube){
      if(sectionId && tab.id!=null){
        chrome.tabs.sendMessage(tab.id, {type:"VIDSPARK_OPEN_SECTION", section:sectionId}, ()=>{ void chrome.runtime.lastError; });
      }
      window.close();
    } else if(sectionId){
      chrome.storage.local.set({vs_pending_section: sectionId}, ()=>{
        chrome.tabs.create({url:"https://www.youtube.com"});
        window.close();
      });
    } else {
      chrome.tabs.create({url:"https://www.youtube.com"});
      window.close();
    }
  });
}

// Éléments DOM
const stateInitial = document.querySelector('.state-initial');
const stateForm = document.querySelector('.state-form');
const stateActivated = document.querySelector('.state-activated');

const btnPlan = document.getElementById('btnPlan');
const btnConnect = document.getElementById('btnConnect');
const btnBackForm = document.getElementById('btnBackForm');
const btnNewActivation = document.getElementById('btnNewActivation');
const btnOpenYouTube = document.getElementById('btnOpenYouTube');
const daysRemaining = document.getElementById('daysRemaining');

// Nouveaux éléments — connexion automatique + code de secours
const connectProgress = document.getElementById('connectProgress');
const connectError = document.getElementById('connectError');
const connectFallback = document.getElementById('connectFallback');
const btnRetryConnect = document.getElementById('btnRetryConnect');
const btnRetryDetect = document.getElementById('btnRetryDetect');
const btnUseCode = document.getElementById('btnUseCode');
const codeRedeemBlock = document.getElementById('codeRedeemBlock');
const inputCode = document.getElementById('inputCode');
const btnRedeemCode = document.getElementById('btnRedeemCode');
const statusForm = document.getElementById('statusForm');

const CONNECT_TIMEOUT_MS = 10000;
let connectTimer = null;
let connectTabId = null;

// Vérifier si déjà activé au démarrage
chrome.storage.local.get(['activation_id', 'activation_secret', 'subscription_expiry'], (data) => {
  if (data.activation_id && data.activation_secret && data.subscription_expiry) {
    const expiry = new Date(data.subscription_expiry);
    if (expiry > new Date()) {
      showActivatedState(data);
    } else {
      // Forfait expiré
      switchState('initial');
    }
  }
});

// Bouton Plan → ouvre le site web
btnPlan.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://vidsparkpro.com/dashboard' });
});

// Bouton Connecter → connexion automatique (ouvre le site, la connexion se
// termine via le handshake site⇄extension géré par background.js).
btnConnect.addEventListener('click', () => {
  switchState('form');
  startAutoConnect();
});

function showConnectSubState(sub) {
  connectProgress.style.display = sub === 'progress' ? '' : 'none';
  connectError.style.display    = sub === 'error'    ? '' : 'none';
  connectFallback.style.display = sub === 'fallback'  ? '' : 'none';
  if (sub !== 'fallback') {
    codeRedeemBlock.style.display = 'none';
    setStatus('', '');
  }
}

function startAutoConnect() {
  showConnectSubState('progress');

  const openTab = () => {
    if (connectTabId != null) {
      chrome.tabs.get(connectTabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          connectTabId = null;
          chrome.tabs.create({ url: 'https://vidsparkpro.com/dashboard.html' }, (t) => { connectTabId = t.id; });
        } else {
          chrome.tabs.update(connectTabId, { active: true });
        }
      });
    } else {
      chrome.tabs.create({ url: 'https://vidsparkpro.com/dashboard.html' }, (t) => { connectTabId = t.id; });
    }
  };
  openTab();

  clearTimeout(connectTimer);
  connectTimer = setTimeout(() => {
    chrome.storage.onChanged.removeListener(onStorageChange);
    showConnectSubState('fallback');
  }, CONNECT_TIMEOUT_MS);

  chrome.storage.onChanged.addListener(onStorageChange);
}

function onStorageChange(changes, area) {
  if (area !== 'local' || !changes.activation_id) return;
  chrome.storage.onChanged.removeListener(onStorageChange);
  clearTimeout(connectTimer);
  chrome.storage.local.get(['activation_id', 'activation_secret', 'subscription_expiry'], (data) => {
    if (data.activation_id && data.activation_secret) showActivatedState(data);
  });
}

btnRetryConnect.addEventListener('click', startAutoConnect);
btnRetryDetect.addEventListener('click', startAutoConnect);

btnUseCode.addEventListener('click', () => {
  clearTimeout(connectTimer);
  chrome.storage.onChanged.removeListener(onStorageChange);
  codeRedeemBlock.style.display = codeRedeemBlock.style.display === 'none' ? 'block' : 'none';
  if (codeRedeemBlock.style.display === 'block') inputCode.focus();
});

btnRedeemCode.addEventListener('click', async () => {
  const code = inputCode.value.trim();
  if (!code) {
    setStatus('⚠️ ' + P('p_code_needed'), 'error');
    return;
  }
  btnRedeemCode.disabled = true;
  setStatus(P('p_verifying'), 'info');

  chrome.runtime.sendMessage({ type: 'VIDSPARK_PAIR_REDEEM', code }, (resp) => {
    btnRedeemCode.disabled = false;
    if (chrome.runtime.lastError || !resp || !resp.success) {
      setStatus('❌ ' + P('p_code_invalid'), 'error');
      return;
    }
    setStatus('✅ ' + P('p_ok'), 'success');
    setTimeout(() => {
      chrome.storage.local.get(['activation_id', 'activation_secret', 'subscription_expiry'], (data) => {
        showActivatedState(data);
      });
    }, 600);
  });
});

// Bouton Retour
btnBackForm.addEventListener('click', () => {
  clearTimeout(connectTimer);
  chrome.storage.onChanged.removeListener(onStorageChange);
  switchState('initial');
});

// Bouton Déconnexion
btnNewActivation.addEventListener('click', () => {
  chrome.storage.local.remove(['activation_id', 'activation_secret', 'subscription_expiry']);
  switchState('initial');
});

btnOpenYouTube.addEventListener('click', () => openOnYouTube(null));

// Utilitaires
function switchState(state) {
  stateInitial.classList.remove('active');
  stateForm.classList.remove('active');
  stateActivated.classList.remove('active');

  if (state === 'initial') stateInitial.classList.add('active');
  if (state === 'form') { stateForm.classList.add('active'); showConnectSubState('progress'); }
  if (state === 'activated') stateActivated.classList.add('active');
}

function setStatus(msg, type) {
  statusForm.textContent = msg;
  statusForm.className = 'status-message';
  if (type === 'error') statusForm.classList.add('status-error');
  if (type === 'success') statusForm.classList.add('status-success');
  if (type === 'info') statusForm.classList.add('status-info');
}

function showActivatedState(data) {
  switchState('activated');
  const expiryDate = new Date(data.subscription_expiry);
  const now = new Date();
  const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  const remaining = Math.max(0, daysLeft);

  // Afficher la durée
  if (remaining === 0) {
    daysRemaining.textContent = P('p_expired');
    daysRemaining.style.color = '#fa6d6d';
  } else {
    daysRemaining.textContent = remaining + ' ' + P(remaining === 1 ? 'p_day' : 'p_days');
  }
  renderLauncher();
}

/* Amorçage de la langue en toute fin de fichier : applyPopupI18n() lit inputId /
   inputSecret, déclarés plus bas en `const`. Lancé depuis le haut du fichier, un
   rappel de storage résolu de façon synchrone plantait le popup (zone morte). */
chrome.storage.local.get(["echoLanguage"], r => {
  const nav = (navigator.language || "en").slice(0,2);
  pLang = (r && r.echoLanguage && P_I18N[r.echoLanguage]) ? r.echoLanguage
        : (P_I18N[nav] ? nav : "en");
  applyPopupI18n();
});
