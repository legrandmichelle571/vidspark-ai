/**
 * VidSpark AI v3.0 — Content Script
 * Architecture : 7 onglets intégrés, aucune page externe sauf rapport complet
 * I18n centralisé, scores multiples, UX premium
 */
"use strict";

/* ══════════════════════════════════════════════════════════════
   I18N — DICTIONNAIRE CENTRALISÉ
   Toutes les clés sont définies ici.
   Ajouter une langue = ajouter un bloc complet.
══════════════════════════════════════════════════════════════ */
const LANG_LIST = [
  {code:"fr",label:"Français"},{code:"en",label:"English"},
  {code:"ar",label:"العربية"},{code:"zh",label:"中文"},
  {code:"hi",label:"हिन्दी"},{code:"ja",label:"日本語"},
  {code:"ru",label:"Русский"},{code:"es",label:"Español"},
  {code:"pt",label:"Português"},{code:"de",label:"Deutsch"},
  {code:"ko",label:"한국어"},{code:"tr",label:"Türkçe"},
  {code:"it",label:"Italiano"},{code:"nl",label:"Nederlands"}
];

/* Listes pour les menus déroulants (niche + région/pays) */
const NICHE_OPTIONS=["Gaming","Cuisine","Tech / High-tech","Vlog / Lifestyle","Beauté / Mode","Sport / Foot","Éducation / Tuto","Musique","Finance / Business","Crypto","Voyage","Comédie / Humour","Actualités / News","Religion","Enfants / Famille","Santé / Fitness","Automobile","Science","Cinéma / Critique","DIY / Bricolage"];

/* Cibles d'audience groupées (groupes + continents + pays arabes + pays) */
const REGION_GROUPS={
  "🌍 Général":["Mondial","Monde arabe","Pays francophones","Pays anglophones","Pays hispanophones","Pays lusophones"],
  "🗺️ Continents / régions":["Afrique","Maghreb","Afrique subsaharienne","Moyen-Orient / Golfe (MENA)","Europe","Amérique du Nord","Amérique latine","Asie","Asie du Sud-Est","Océanie"],
  "🕌 Pays arabes":["Algérie","Maroc","Tunisie","Libye","Égypte","Mauritanie","Soudan","Arabie Saoudite","Émirats (EAU)","Qatar","Koweït","Bahreïn","Oman","Yémen","Jordanie","Liban","Syrie","Irak","Palestine"],
  "🇪🇺 Europe":["France","Belgique","Suisse","Royaume-Uni","Allemagne","Espagne","Italie","Portugal","Pays-Bas","Russie"],
  "🌎 Amériques":["USA","Canada","Brésil","Mexique","Argentine"],
  "🌏 Asie & autres":["Inde","Turquie","Indonésie","Pakistan","Japon","Corée du Sud","Chine","Nigéria"]
};

/* Traductions des labels (valeur = FR canonique envoyée à l'IA ; label affiché traduit) */
const LABEL_I18N={
  "Gaming":{en:"Gaming",ar:"ألعاب",ja:"ゲーム"},"Cuisine":{en:"Cooking",ar:"طبخ",ja:"料理"},"Tech / High-tech":{en:"Tech",ar:"تقنية",ja:"テック"},"Vlog / Lifestyle":{en:"Vlog / Lifestyle",ar:"فلوق / نمط حياة",ja:"Vlog / ライフ"},"Beauté / Mode":{en:"Beauty / Fashion",ar:"جمال وموضة",ja:"美容 / ファッション"},"Sport / Foot":{en:"Sports / Football",ar:"رياضة / كرة قدم",ja:"スポーツ / サッカー"},"Éducation / Tuto":{en:"Education / Tutorial",ar:"تعليم / شرح",ja:"教育 / チュートリアル"},"Musique":{en:"Music",ar:"موسيقى",ja:"音楽"},"Finance / Business":{en:"Finance / Business",ar:"مال وأعمال",ja:"金融 / ビジネス"},"Crypto":{en:"Crypto",ar:"كريبتو",ja:"暗号資産"},"Voyage":{en:"Travel",ar:"سفر",ja:"旅行"},"Comédie / Humour":{en:"Comedy",ar:"كوميديا",ja:"コメディ"},"Actualités / News":{en:"News",ar:"أخبار",ja:"ニュース"},"Religion":{en:"Religion",ar:"دين",ja:"宗教"},"Enfants / Famille":{en:"Kids / Family",ar:"أطفال / عائلة",ja:"子供 / 家族"},"Santé / Fitness":{en:"Health / Fitness",ar:"صحة / لياقة",ja:"健康 / フィットネス"},"Automobile":{en:"Automotive",ar:"سيارات",ja:"車"},"Science":{en:"Science",ar:"علوم",ja:"科学"},"Cinéma / Critique":{en:"Film / Review",ar:"سينما / نقد",ja:"映画 / レビュー"},"DIY / Bricolage":{en:"DIY",ar:"أعمال يدوية",ja:"DIY"},
  "🌍 Général":{en:"🌍 General",ar:"🌍 عام",ja:"🌍 一般"},"🗺️ Continents / régions":{en:"🗺️ Continents / regions",ar:"🗺️ القارات / المناطق",ja:"🗺️ 大陸・地域"},"🕌 Pays arabes":{en:"🕌 Arab countries",ar:"🕌 الدول العربية",ja:"🕌 アラブ諸国"},"🇪🇺 Europe":{en:"🇪🇺 Europe",ar:"🇪🇺 أوروبا",ja:"🇪🇺 ヨーロッパ"},"🌎 Amériques":{en:"🌎 Americas",ar:"🌎 الأمريكتان",ja:"🌎 南北アメリカ"},"🌏 Asie & autres":{en:"🌏 Asia & others",ar:"🌏 آسيا وأخرى",ja:"🌏 アジア・その他"},
  "Mondial":{en:"Worldwide",ar:"عالمي",ja:"世界"},"Monde arabe":{en:"Arab world",ar:"العالم العربي",ja:"アラブ世界"},"Pays francophones":{en:"Francophone",ar:"الدول الفرنكوفونية",ja:"フランス語圏"},"Pays anglophones":{en:"English-speaking",ar:"الدول الأنجلوفونية",ja:"英語圏"},"Pays hispanophones":{en:"Spanish-speaking",ar:"الدول الناطقة بالإسبانية",ja:"スペイン語圏"},"Pays lusophones":{en:"Portuguese-speaking",ar:"الدول الناطقة بالبرتغالية",ja:"ポルトガル語圏"},
  "Afrique":{en:"Africa",ar:"أفريقيا",ja:"アフリカ"},"Maghreb":{en:"Maghreb",ar:"المغرب العربي",ja:"マグレブ"},"Afrique subsaharienne":{en:"Sub-Saharan Africa",ar:"أفريقيا جنوب الصحراء",ja:"サブサハラ"},"Moyen-Orient / Golfe (MENA)":{en:"Middle East / Gulf (MENA)",ar:"الشرق الأوسط / الخليج",ja:"中東 / 湾岸"},"Europe":{en:"Europe",ar:"أوروبا",ja:"ヨーロッパ"},"Amérique du Nord":{en:"North America",ar:"أمريكا الشمالية",ja:"北米"},"Amérique latine":{en:"Latin America",ar:"أمريكا اللاتينية",ja:"ラテンアメリカ"},"Asie":{en:"Asia",ar:"آسيا",ja:"アジア"},"Asie du Sud-Est":{en:"Southeast Asia",ar:"جنوب شرق آسيا",ja:"東南アジア"},"Océanie":{en:"Oceania",ar:"أوقيانوسيا",ja:"オセアニア"},
  "Algérie":{en:"Algeria",ar:"الجزائر",ja:"アルジェリア"},"Maroc":{en:"Morocco",ar:"المغرب",ja:"モロッコ"},"Tunisie":{en:"Tunisia",ar:"تونس",ja:"チュニジア"},"Libye":{en:"Libya",ar:"ليبيا",ja:"リビア"},"Égypte":{en:"Egypt",ar:"مصر",ja:"エジプト"},"Mauritanie":{en:"Mauritania",ar:"موريتانيا",ja:"モーリタニア"},"Soudan":{en:"Sudan",ar:"السودان",ja:"スーダン"},"Arabie Saoudite":{en:"Saudi Arabia",ar:"السعودية",ja:"サウジアラビア"},"Émirats (EAU)":{en:"UAE",ar:"الإمارات",ja:"UAE"},"Qatar":{en:"Qatar",ar:"قطر",ja:"カタール"},"Koweït":{en:"Kuwait",ar:"الكويت",ja:"クウェート"},"Bahreïn":{en:"Bahrain",ar:"البحرين",ja:"バーレーン"},"Oman":{en:"Oman",ar:"عُمان",ja:"オマーン"},"Yémen":{en:"Yemen",ar:"اليمن",ja:"イエメン"},"Jordanie":{en:"Jordan",ar:"الأردن",ja:"ヨルダン"},"Liban":{en:"Lebanon",ar:"لبنان",ja:"レバノン"},"Syrie":{en:"Syria",ar:"سوريا",ja:"シリア"},"Irak":{en:"Iraq",ar:"العراق",ja:"イラク"},"Palestine":{en:"Palestine",ar:"فلسطين",ja:"パレスチナ"},
  "France":{en:"France",ar:"فرنسا",ja:"フランス"},"Belgique":{en:"Belgium",ar:"بلجيكا",ja:"ベルギー"},"Suisse":{en:"Switzerland",ar:"سويسرا",ja:"スイス"},"Royaume-Uni":{en:"United Kingdom",ar:"المملكة المتحدة",ja:"イギリス"},"Allemagne":{en:"Germany",ar:"ألمانيا",ja:"ドイツ"},"Espagne":{en:"Spain",ar:"إسبانيا",ja:"スペイン"},"Italie":{en:"Italy",ar:"إيطاليا",ja:"イタリア"},"Portugal":{en:"Portugal",ar:"البرتغال",ja:"ポルトガル"},"Pays-Bas":{en:"Netherlands",ar:"هولندا",ja:"オランダ"},"Russie":{en:"Russia",ar:"روسيا",ja:"ロシア"},
  "USA":{en:"USA",ar:"الولايات المتحدة",ja:"アメリカ"},"Canada":{en:"Canada",ar:"كندا",ja:"カナダ"},"Brésil":{en:"Brazil",ar:"البرازيل",ja:"ブラジル"},"Mexique":{en:"Mexico",ar:"المكسيك",ja:"メキシコ"},"Argentine":{en:"Argentina",ar:"الأرجنتين",ja:"アルゼンチン"},
  "Inde":{en:"India",ar:"الهند",ja:"インド"},"Turquie":{en:"Turkey",ar:"تركيا",ja:"トルコ"},"Indonésie":{en:"Indonesia",ar:"إندونيسيا",ja:"インドネシア"},"Pakistan":{en:"Pakistan",ar:"باكستان",ja:"パキスタン"},"Japon":{en:"Japan",ar:"اليابان",ja:"日本"},"Corée du Sud":{en:"South Korea",ar:"كوريا الجنوبية",ja:"韓国"},"Chine":{en:"China",ar:"الصين",ja:"中国"},"Nigéria":{en:"Nigeria",ar:"نيجيريا",ja:"ナイジェリア"},
  "3 vidéos/semaine":{en:"3 videos/week",ar:"3 فيديوهات/أسبوع",ja:"週3本"},"1 vidéo/jour":{en:"1 video/day",ar:"فيديو/يوم",ja:"1日1本"},"2 Shorts/jour":{en:"2 Shorts/day",ar:"Shorts×2/يوم",ja:"Shorts 2本/日"},"Vidéo + Shorts":{en:"Video + Shorts",ar:"فيديو + Shorts",ja:"動画 + Shorts"}
};
/* Label affiché selon la langue (la valeur reste FR canonique) */
function optLabel(v){ if(currentLanguage==="fr") return v; const m=LABEL_I18N[v]; return m?(m[currentLanguage]||m.en||v):v; }

/* Construit un <select> stylé (liste simple) */
function selectHTML(id,list,ph,style){
  return `<select id="${id}" style="${style}"><option value="">${ph}</option>${list.map(o=>`<option value="${esc(o)}">${esc(optLabel(o))}</option>`).join("")}</select>`;
}
/* Construit un <select> de régions avec sous-groupes (optgroups) */
function regionSelectHTML(id,ph,style){
  const groups=Object.entries(REGION_GROUPS).map(([g,opts])=>`<optgroup label="${esc(optLabel(g))}">${opts.map(o=>`<option value="${esc(o)}">${esc(optLabel(o))}</option>`).join("")}</optgroup>`).join("");
  return `<select id="${id}" style="${style}"><option value="">${ph}</option>${groups}</select>`;
}

/* Score CTR instantané d'un titre (côté navigateur, sans IA) — progressif */
function computeTitleScore(t){
  t=(t||"").trim(); const lower=t.toLowerCase(); const len=t.length;
  const words=t.split(/\s+/).filter(Boolean).length;
  const power=["incroyable","secret","gratuit","meilleur","facile","rapide","jamais","choquant","astuce","ultime","best","free","easy","ultimate","amazing","top","viral","new","سر","مجان","أفضل","سهل","نصيحة","صدمة","حصري","خطير"];
  const okLen=len>=40&&len<=70;
  const okNum=/\d/.test(t);
  const okEmo=power.some(w=>lower.includes(w));
  const okHook=/^(comment|pourquoi|how|why|what|top|كيف|لماذا|ما|أفضل)/i.test(t)||/\d/.test(t.slice(0,4))||/[?؟]/.test(t);
  const okPunct=/[?!؟]/.test(t);
  // Score progressif (crédit partiel pour la longueur, base pour un titre correct)
  const cLen = okLen?25:(len>=25&&len<=85?16:(len>=12?8:0));
  const cWords = words>=4?12:(words>=2?6:0);
  const cBase = len>=8?8:0;
  let score=cLen+cWords+cBase+(okNum?15:0)+(okEmo?15:0)+(okHook?15:0)+(okPunct?10:0);
  score=Math.max(0,Math.min(100,score));
  const checks=[
    {label:T("td_len"),ok:cLen>=16,tip:T("tdh_len")},
    {label:T("td_num"),ok:okNum,tip:T("tdh_num")},
    {label:T("td_emotion"),ok:okEmo,tip:T("tdh_emotion")},
    {label:T("td_hook"),ok:okHook,tip:T("tdh_hook")},
    {label:T("td_punct"),ok:okPunct,tip:T("tdh_punct")}
  ];
  return {score, checks};
}

/* Petite icône "?" d'aide avec explication au survol */
function help(txt){ return `<span class="echo-help" title="${esc(txt)}">?</span>`; }

/* Convertit "6m" → 6000000, "14k" → 14000, "5 000" → 5000 */
function parseSubs(str){
  if(!str) return 0;
  let s=(""+str).toLowerCase().replace(/[\s,]/g,"").trim();
  const m=s.match(/^([\d.]+)([km])?$/);
  if(!m) return parseInt(s.replace(/[^\d]/g,""),10)||0;
  let n=parseFloat(m[1])||0;
  if(m[2]==="m") n*=1e6; else if(m[2]==="k") n*=1e3;
  return Math.round(n);
}

const I18N = {
  fr:{
    /* navigation */
    nav_coach:"🧠 Coach", coach_potential:"Potentiel de la vidéo", coach_actions:"actions", coach_fix:"Corriger", coach_grow:"Trouver une idée virale", coach_a_title:"Corrige ton titre", coach_w_title_kw:"Titre à optimiser pour le SEO", coach_w_title_long:"Titre trop long (plus de 70 caractères)", coach_a_thumb:"Améliore ta miniature", coach_w_thumb:"Forte marge d'amélioration sur la miniature", coach_a_short:"Publie un Short sur ce sujet", coach_w_short:"Booste ton potentiel viral avec un Short", coach_ok_title:"Titre OK", coach_ok_thumb:"Miniature OK", coach_ok_viral:"Potentiel viral OK", coach_all_good:"Ta vidéo est déjà bien optimisée !", sec_coach:"Coach", sec_analyser:"Analyser", sec_creer:"Créer", sec_studio:"Studio", sec_croissance:"Croissance",
    nav_overview:"Aperçu", nav_seo:"SEO", nav_thumbnail:"Miniature",
    nav_viral:"Viral", nav_competitor:"Concurrence", nav_titles:"Titres IA", nav_actions:"Actions", nav_abtest:"A/B Test",
    abtest_intro:"Compare deux titres : l'IA prédit lequel aura le meilleur taux de clics.",
    abtest_a:"Titre A", abtest_b:"Titre B", abtest_run:"⚔️ Comparer les titres",
    abtest_winner:"Gagnant", abtest_verdict:"Verdict de l'IA", abtest_improved:"💡 Titre suggéré (encore meilleur)",
    abtest_ctr:"CTR estimé", abtest_confidence:"Confiance", abtest_use:"Utiliser ce titre",
    thumbab_title:"A/B Miniatures", thumbab_intro:"Compare 2 miniatures : l'IA Vision dit laquelle aura le meilleur CTR et pourquoi.",
    thumbab_a:"Miniature A", thumbab_b:"Miniature B", thumbab_run:"📸 Comparer les miniatures", thumbab_tips:"💡 Pour améliorer la gagnante", thumbab_need2:"Choisis 2 images d'abord",
    thumbab_prompt_label:"🎨 Prompt détaillé pour créer la miniature améliorée :", thumbab_prompt_copy:"Copier le prompt", thumbab_prompt_hint:"Colle ce prompt dans une IA d'image (Midjourney, DALL·E, ChatGPT, Leonardo…) pour générer ta miniature.",
    nav_shorts:"Shorts", shorts_intro:"Transforme cette vidéo en idées de Shorts viraux (titre, hook, script, hashtags).",
    shorts_generate:"🎬 Générer des Shorts", shorts_hook:"Hook (3 premières sec)", shorts_script:"Script",
    shorts_duration:"Durée", shorts_copy:"Copier le script",
    shorts_summary:"Résumé", shorts_clips:"✂️ Passages à couper", shorts_estimated:"estimé", shorts_real:"basé sur les sous-titres",
    /* scores */
    score_seo:"Score SEO", score_viral:"Score Viral",
    score_thumb:"Score Miniature", score_competition:"Concurrence",
    score_global:"Score Global",
    /* stats */
    views:"vues", desc_chars:"car. description", title_chars:"car. titre",
    /* checklist */
    checklist_title:"Checklist SEO", criteria_ok:"critères validés",
    cl_len_label:"Longueur titre", cl_len_ok:n=>`${n} car. — parfait`,
    cl_len_short:n=>`${n} car. — trop court`, cl_len_long:n=>`${n} car. — trop long`,
    cl_len_impact_ok:"Longueur optimale pour le référencement YouTube.",
    cl_len_impact_fix:n=>`Titre de ${n} car. Impact SEO estimé : ${n<45?"-15%":"-10%"}. Viser 55–70 car.`,
    cl_num_label:"Chiffre dans le titre", cl_num_ok:"Chiffre détecté — boost CTR",
    cl_num_fix:"Aucun chiffre. Les titres avec chiffres ont +40% de CTR.",
    cl_em_label:"Mot émotionnel", cl_em_ok:"Mot fort détecté",
    cl_em_fix:'Ajouter : "Incroyable", "Gratuit", "Secret", "Ultime"',
    cl_hk_label:"Hook CTR", cl_hk_ok:"Bon hook en début de titre",
    cl_hk_fix:'Commencer par "Comment", "Pourquoi", ou un chiffre',
    cl_desc_label:"Description (300+ car.)", cl_desc_ok:n=>`${n} car. — bonne`,
    cl_desc_fix:n=>`${n} car. — viser 500+`,
    /* seo tab */
    seo_title_analysis:"Analyse du titre", seo_desc_analysis:"Analyse description",
    seo_keywords:"Mots-clés détectés", seo_suggestions:"Suggestions IA",
    seo_impact:"Impact SEO", seo_recommendation:"Recommandation",
    /* thumbnail tab */
    thumb_score:"Score Miniature", thumb_preview:"Aperçu miniature",
    thumb_emotions:"Analyse émotionnelle", thumb_strengths:"Forces",
    thumb_weaknesses:"Faiblesses", thumb_suggestions:"Suggestions",
    thumb_download:"Télécharger HD", thumb_copy_url:"Copier URL",
    thumb_face:"Visage détecté", thumb_no_face:"Pas de visage",
    thumb_contrast:"Contraste", thumb_text:"Lisibilité texte",
    thumb_colors:"Couleurs", thumb_elements:"Éléments",
    download:"Télécharger", regenerate:"Régénérer", share:"Partager", export:"Exporter",
    tk_ready:"Contenu prêt à publier", tk_hooks:"Hooks",
    tkr_ready:"Clips prêts à découper", tk_clips:"clips",
    tki_ready:"Idées prêtes", tk_ideas:"idées",
    tkh_ready:"Hooks prêts",
    tkc_ready:"Calendrier prêt", tk_days:"jours",
    /* viral tab */
    viral_score:"Score Viral", viral_probability:"Probabilité virale",
    viral_low:"Faible", viral_medium:"Moyenne", viral_high:"Élevée",
    viral_factors_pos:"Facteurs positifs", viral_factors_neg:"Facteurs limitants",
    viral_prediction:"Prédiction IA", viral_tips:"Conseils pour maximiser",
    /* competitor tab */
    comp_title:"Analyse Concurrentielle", comp_position:"Votre position",
    comp_keywords:"Mots-clés de la niche", comp_missing:"Mots-clés manquants",
    comp_opportunities:"Opportunités", comp_note:"Note",
    /* titles tab */
    titles_generate:"🚀 Générer 5 titres optimisés",
    titles_seo:"Version SEO", titles_ctr:"Version CTR",
    titles_viral:"Version Virale", titles_shorts:"Version Shorts",
    titles_trending:"Version Trending",
    titles_copy:"Copier", titles_score:"Score",
    /* actions tab */
    act_copy_title:"📋 Copier titre", act_description:"📝 Description IA",
    act_tags:"🏷 Tags IA", act_thumbnail:"🖼 Miniature HD",
    act_full_report:"✨ Rapport IA complet",
    act_copy_desc:"📋 Copier la description", act_copy_tags:"📋 Copier tous les tags",
    act_desc_label:"Description IA", act_tags_label:"Tags & Hashtags IA",
    act_tags_yt:"Tags YouTube", act_hashtags:"Hashtags",
    /* shared */
    loading:"Analyse IA en cours…", loading_titles:"Génération des titres…",
    loading_desc:"Génération de la description…", loading_tags:"Génération des tags…",
    error_generic:"Erreur — vérifier le proxy", error_no_video:"Aucune vidéo détectée",
    copied_title:"Titre copié ✓", copied_desc:"Description copiée ✓",
    copied_tags:"Tags copiés ✓", lang_changed:"Langue changée",
    /* plan badges */
    plan_free:"Gratuit", plan_pro:"Pro", plan_business:"Business",
    upgrade_msg:"Passer à Pro pour débloquer toutes les fonctionnalités IA",
    upgrade_btn:"Passer à Pro →",

    /* ── NOUVELLES CLÉS I18N ── */
    thumb_good_contrast:"Bon contraste détecté",thumb_bad_contrast:"Contraste à améliorer",
    thumb_good_text:"Texte lisible estimé",thumb_bad_text:"Lisibilité à améliorer",
    thumb_format:"Format standard — optimal",thumb_face_proxy:"Analyse IA requise (proxy)",
    thumb_face_ok:"Visage expressif détecté",
    thumb_rec1:"Ajouter un visage expressif (+38% CTR)",thumb_rec2:"Texte en gros plan, 4–6 mots max",
    thumb_rec3:"Couleurs chaudes (rouge/jaune) sur fond sombre",thumb_rec4:"Flèche ou cercle vers l'élément principal",
    thumb_current:"Actuel",thumb_potential:"Potentiel",
    thumb_ctr_current:"CTR estimé actuel",thumb_ctr_potential:"CTR potentiel",
    viral_tip1:"Publier entre 14h–17h heure locale",viral_tip2:"Partager dans les 30 premières minutes",
    viral_tip3:"Ajouter des timestamps en description",viral_tip4:"Répondre aux 10 premiers commentaires",
    viral_current:"Score actuel",viral_potential_label:"Score potentiel",viral_possible_with:"pts possibles avec :",
    viral_fix_hook:"Meilleur hook CTR",viral_fix_emotion:"Mot émotionnel fort",
    viral_fix_desc:"Description optimisée",viral_fix_number:"Chiffre dans le titre",
    comp_opp1:"Créneaux sous-exploités dans votre niche",comp_opp2:"Angle original non couvert par les concurrents",
    comp_opp3:"Format long-form sous-représenté sur ce sujet",comp_opp4:"Version francophone moins concurrencée",
    comp_pro_note:"L'analyse en temps réel des concurrents est disponible en version Pro.",
    overview_gain_label:"Potentiel si corrigé",overview_ctr_label:"CTR estimé",
    seo_gain_potential:"Gain SEO potentiel",seo_current:"Score actuel",seo_potential_label:"Score potentiel",
    seo_action:"Action",seo_gain_col:"Gain",seo_score_col:"Score",seo_total:"Total optimisé",
    impact_very_high:"Très élevé",impact_high:"Élevé",impact_medium:"Moyen",impact_low:"Faible",
    cl_punct_label:"Ponctuation CTR (? ou !)",cl_punct_ok:"Ponctuation engageante présente",
    cl_punct_fix:"Aucune ponctuation CTR — ajouter ? ou !",
    cl_punct_why:"Les titres avec ? ou ! génèrent +15% de clics.",cl_punct_gain:"+5 points SEO",
    report_exec:"Résumé Exécutif",report_print:"🖨 Imprimer",report_close:"✕ Fermer",
    report_seo_full:"Analyse SEO complète",report_thumb_full:"Analyse miniature complète",
    report_viral_full:"Analyse virale complète",report_comp_full:"Analyse concurrentielle complète",
    report_titles:"Titres alternatifs générés",report_opportunities:"Opportunités détectées",
    report_actions:"Actions prioritaires",report_charts:"Analyse des scores",
    report_before_after:"Avant / Après optimisation",report_loading:"Génération du rapport premium…",
    report_no_data:"Ouvrez ce rapport depuis l'extension VidSpark AI sur une vidéo YouTube.",
    report_keywords:"Mots-clés du titre",report_missing_kw:"Mots-clés potentiellement manquants",
    report_impact_table:"Impact SEO estimé par correction",
    report_ctr_current:"CTR estimé actuel",report_ctr_potential:"CTR potentiel",
    report_emotions:"Analyse émotionnelle",report_visual_criteria:"Critères visuels",
    report_opp_subject:"Sujet manquant",report_opp_kw:"Mots-clés",
    report_opp_trend:"Tendance",report_opp_niche:"Niche",
    report_viral_impact:"Impact de chaque correction",
    report_comp_note_text:"L'analyse en temps réel des concurrents est disponible en Pro via YouTube Data API v3.",
    titles_seo_label:"SEO",titles_ctr_label:"CTR",titles_viral_label:"Viral",
    titles_shorts_label:"Shorts",titles_trending_label:"Trending",
  viral_pos_hook:"CTR haak aan het begin van de titel",
  viral_pos_num:"Getal in titel",
  viral_pos_em:"Emotioneel woord aanwezig",
  viral_pos_desc:"Beschrijving lang genoeg",
  viral_pos_len:"Optimale titellengte",
  viral_neg_hook:"Geen CTR haak — voeg vraag of getal toe aan begin",
  viral_neg_num:"Geen getal — titels met getallen krijgen +40% CTR",
  viral_neg_em:"Geen emotioneel woord — voeg krachtwoord toe",
  viral_neg_desc_tpl:"Korte beschrijving (N tekens) — doel 500+",
  viral_neg_len_short:"Titel te kort",
  viral_neg_len_long:"Titel te lang",
  viral_potential_title:"Viraal potentieel",
  example_label:"Voorbeeld:",recommendation_label:"AANBEVELING:",
  impact_pos_num:"Positief effect +8% CTR",impact_neg_num:"Een getal toevoegen kan de CTR met 15–40% verhogen",
  btn_viral_ai:"✨ Virale AI Analyse",format_standard:"Format 16:9 standard",
    btn_report:"Générer suggestions IA",rtl:"false",
    seo_tab_analyse:"📊 Analyse",seo_tab_optim:"🎯 Optimisation",seo_tab_kw:"🔑 Mots-clés",
    seo_tab_rec_kw:"Mots-clés recommandés",seo_tab_issues:"problèmes",seo_all_ok:"Tous les critères validés !",
    example_label:"Exemple :",recommendation_label:"RECOMMANDATION :",
    impact_pos_num:"Impact positif +8% CTR estimé",impact_neg_num:"Ajouter un chiffre peut augmenter le CTR de 15–40%",
    viral_pos_hook:"Hook CTR en début de titre",
    viral_pos_num:"Chiffre dans le titre",
    viral_pos_em:"Mot émotionnel présent",
    viral_pos_desc:"Description suffisamment longue",
    viral_pos_len:"Longueur de titre optimale",
    viral_neg_hook:"Pas de hook CTR — ajouter une question ou un chiffre en début",
    viral_neg_num:"Pas de chiffre — les titres avec chiffres ont +40% CTR",
    viral_neg_em:"Pas de mot émotionnel — ajouter un mot fort",
    viral_neg_desc_tpl:"Description courte (N car.) — viser 500+",
    viral_neg_len_short:"Titre trop court",
    viral_neg_len_long:"Titre trop long",
    viral_potential_title:"Score viral potentiel",
    btn_viral_ai:"✨ Analyse virale IA",
    emotion_curiosity:"Curiosité", emotion_surprise:"Surprise",
    emotion_desire:"Désir", emotion_urgency:"Urgence", emotion_trust:"Confiance",
    cl_len_why:"La longueur du titre influence directement l'affichage dans les résultats YouTube et Google. Entre 55 et 70 caractères est l'idéal.",
    cl_num_why:"Les chiffres rendent le titre concret et mesurable. L'œil humain est naturellement attiré par les chiffres dans un flux de texte.",
    cl_em_why2:"Les mots émotionnels déclenchent une réponse psychologique immédiate qui pousse à cliquer.",
    cl_hk_why2:"Les 3 premiers mots du titre sont les plus lus. Un hook sous forme de question crée une boucle ouverte.",
    cl_desc_why:"YouTube indexe le texte de votre description. Une description riche aide l'algorithme à comprendre votre vidéo.",
    cl_len_s1:"Ajouter des mots-clés de niche", cl_len_s2:"Préciser le contenu", cl_len_s3:"Inclure le bénéfice principal",
    cl_len_r1:"Supprimer les mots non essentiels", cl_len_r2:"Utiliser des abréviations", cl_len_r3:"Reformuler en une phrase",
    cl_num_s1:"Essayer : \"5 astuces...\"", cl_num_s2:"Essayer : \"100% gratuit...\"", cl_num_s3:"Essayer : \"En 10 minutes\"",
    cl_em_s1:"\"Incroyable\"", cl_em_s2:"\"Gratuit\"", cl_em_s3:"\"Secret\"", cl_em_s4:"\"Ultime\"",
    cl_hk_s1:"\"Comment...\"", cl_hk_s2:"\"Pourquoi...\"", cl_hk_s3:"\"Les X meilleures...\"",
    cl_desc_s1:"Ajouter des mots-clés naturels", cl_desc_s2:"Inclure des timestamps", cl_desc_s3:"Ajouter des liens et CTA",
    cl_punct_s1:"Ajouter une question", cl_punct_s2:"Ajouter une exclamation à la fin",
    missing_kw_list:"tuto,gratuit,complet,2024,débutant,guide",
    comp_opp_label:"Créneaux sous-exploités dans votre niche"
  },
  en:{
    nav_coach:"🧠 Coach", coach_potential:"Video potential", coach_actions:"actions", coach_fix:"Fix it", coach_grow:"Find a viral idea", coach_a_title:"Fix your title", coach_w_title_kw:"Title needs SEO optimization", coach_w_title_long:"Title too long (over 70 characters)", coach_a_thumb:"Improve your thumbnail", coach_w_thumb:"Big room to improve the thumbnail", coach_a_short:"Post a Short on this topic", coach_w_short:"Boost your viral potential with a Short", coach_ok_title:"Title OK", coach_ok_thumb:"Thumbnail OK", coach_ok_viral:"Viral potential OK", coach_all_good:"Your video is already well optimized!", sec_coach:"Coach", sec_analyser:"Analyze", sec_creer:"Create", sec_studio:"Studio", sec_croissance:"Growth",
    nav_overview:"Overview", nav_seo:"SEO", nav_thumbnail:"Thumbnail",
    nav_viral:"Viral", nav_competitor:"Competitors", nav_titles:"AI Titles", nav_actions:"Actions", nav_abtest:"A/B Test",
    abtest_intro:"Compare two titles: AI predicts which one gets the higher click-through rate.",
    abtest_a:"Title A", abtest_b:"Title B", abtest_run:"⚔️ Compare titles",
    abtest_winner:"Winner", abtest_verdict:"AI Verdict", abtest_improved:"💡 Suggested title (even better)",
    abtest_ctr:"Est. CTR", abtest_confidence:"Confidence", abtest_use:"Use this title",
    thumbab_title:"Thumbnail A/B", thumbab_intro:"Compare 2 thumbnails: Vision AI tells which gets the higher CTR and why.",
    thumbab_a:"Thumbnail A", thumbab_b:"Thumbnail B", thumbab_run:"📸 Compare thumbnails", thumbab_tips:"💡 To improve the winner", thumbab_need2:"Pick 2 images first",
    thumbab_prompt_label:"🎨 Detailed prompt to create the improved thumbnail:", thumbab_prompt_copy:"Copy prompt", thumbab_prompt_hint:"Paste this prompt into an image AI (Midjourney, DALL·E, ChatGPT, Leonardo…) to generate your thumbnail.",
    nav_shorts:"Shorts", shorts_intro:"Turn this video into viral Shorts ideas (title, hook, script, hashtags).",
    shorts_generate:"🎬 Generate Shorts", shorts_hook:"Hook (first 3 sec)", shorts_script:"Script",
    shorts_duration:"Duration", shorts_copy:"Copy script",
    shorts_summary:"Summary", shorts_clips:"✂️ Clips to cut", shorts_estimated:"estimated", shorts_real:"based on captions",
    score_seo:"SEO Score", score_viral:"Viral Score",
    score_thumb:"Thumbnail Score", score_competition:"Competition",
    score_global:"Global Score",
    views:"views", desc_chars:"chars desc.", title_chars:"chars title",
    checklist_title:"SEO Checklist", criteria_ok:"criteria passed",
    cl_len_label:"Title length", cl_len_ok:n=>`${n} chars — perfect`,
    cl_len_short:n=>`${n} chars — too short`, cl_len_long:n=>`${n} chars — too long`,
    cl_len_impact_ok:"Optimal length for YouTube SEO.",
    cl_len_impact_fix:n=>`Title is ${n} chars. SEO impact: ${n<45?"-15%":"-10%"}. Target 55–70 chars.`,
    cl_num_label:"Number in title", cl_num_ok:"Number detected — CTR boost",
    cl_num_fix:"No number. Titles with numbers get +40% CTR.",
    cl_em_label:"Emotional word", cl_em_ok:"Power word detected",
    cl_em_fix:'Add: "Amazing", "Free", "Secret", "Ultimate"',
    cl_hk_label:"CTR Hook", cl_hk_ok:"Good hook at title start",
    cl_hk_fix:'Start with "How to", "Why", or a number',
    cl_desc_label:"Description (300+ chars)", cl_desc_ok:n=>`${n} chars — good`,
    cl_desc_fix:n=>`${n} chars — aim for 500+`,
    seo_title_analysis:"Title analysis", seo_desc_analysis:"Description analysis",
    seo_keywords:"Detected keywords", seo_suggestions:"AI suggestions",
    seo_impact:"SEO impact", seo_recommendation:"Recommendation",
    thumb_score:"Thumbnail Score", thumb_preview:"Thumbnail preview",
    thumb_emotions:"Emotional analysis", thumb_strengths:"Strengths",
    thumb_weaknesses:"Weaknesses", thumb_suggestions:"Suggestions",
    thumb_download:"Download HD", thumb_copy_url:"Copy URL",
    download:"Download", regenerate:"Regenerate", share:"Share", export:"Export",
    tk_ready:"Content ready to publish", tk_hooks:"Hooks",
    tkr_ready:"Clips ready to cut", tk_clips:"clips",
    tki_ready:"Ideas ready", tk_ideas:"ideas",
    tkh_ready:"Hooks ready",
    tkc_ready:"Calendar ready", tk_days:"days",
    thumb_face:"Face detected", thumb_no_face:"No face",
    thumb_contrast:"Contrast", thumb_text:"Text readability",
    thumb_colors:"Colors", thumb_elements:"Elements",
    viral_score:"Viral Score", viral_probability:"Viral probability",
    viral_low:"Low", viral_medium:"Medium", viral_high:"High",
    viral_factors_pos:"Positive factors", viral_factors_neg:"Limiting factors",
    viral_prediction:"AI prediction", viral_tips:"Tips to maximize",
    comp_title:"Competitive Analysis", comp_position:"Your position",
    comp_keywords:"Niche keywords", comp_missing:"Missing keywords",
    comp_opportunities:"Opportunities", comp_note:"Note",
    titles_generate:"🚀 Generate 5 optimized titles",
    titles_seo:"SEO Version", titles_ctr:"CTR Version",
    titles_viral:"Viral Version", titles_shorts:"Shorts Version",
    titles_trending:"Trending Version",
    titles_copy:"Copy", titles_score:"Score",
    act_copy_title:"📋 Copy title", act_description:"📝 AI Description",
    act_tags:"🏷 AI Tags", act_thumbnail:"🖼 HD Thumbnail",
    act_full_report:"✨ Full AI Report",
    act_copy_desc:"📋 Copy description", act_copy_tags:"📋 Copy all tags",
    act_desc_label:"AI Description", act_tags_label:"AI Tags & Hashtags",
    act_tags_yt:"YouTube Tags", act_hashtags:"Hashtags",
    loading:"AI analysis in progress…", loading_titles:"Generating titles…",
    loading_desc:"Generating description…", loading_tags:"Generating tags…",
    error_generic:"Error — check proxy", error_no_video:"No video detected",
    copied_title:"Title copied ✓", copied_desc:"Description copied ✓",
    copied_tags:"Tags copied ✓", lang_changed:"Language changed",
    plan_free:"Free", plan_pro:"Pro", plan_business:"Business",
    upgrade_msg:"Upgrade to Pro to unlock all AI features",
    upgrade_btn:"Upgrade to Pro →",

    thumb_good_contrast:"Good contrast detected",thumb_bad_contrast:"Contrast needs improvement",
    thumb_good_text:"Text readable estimated",thumb_bad_text:"Readability needs improvement",
    thumb_format:"Standard format — optimal",thumb_face_proxy:"AI vision analysis requires proxy",
    thumb_face_ok:"Expressive face detected",
    thumb_rec1:"Add expressive face (+38% CTR)",thumb_rec2:"Large text, max 4–6 words",
    thumb_rec3:"Warm colors (red/yellow) on dark background",thumb_rec4:"Arrow or circle toward main element",
    thumb_current:"Current",thumb_potential:"Potential",
    thumb_ctr_current:"Estimated current CTR",thumb_ctr_potential:"Potential CTR",
    viral_tip1:"Publish between 2pm–5pm local time",viral_tip2:"Share within first 30 minutes",
    viral_tip3:"Add timestamps to description",viral_tip4:"Reply to first 10 comments",
    viral_current:"Current score",viral_potential_label:"Potential score",viral_possible_with:"pts possible with:",
    viral_fix_hook:"Better CTR hook",viral_fix_emotion:"Strong emotional word",
    viral_fix_desc:"Optimized description",viral_fix_number:"Number in title",
    comp_opp1:"Underexploited niches in your topic",comp_opp2:"Original angle not covered by competitors",
    comp_opp3:"Long-form underrepresented on this topic",comp_opp4:"Your language version less competitive",
    comp_pro_note:"Real-time competitor analysis available in Pro version.",
    overview_gain_label:"Potential if corrected",overview_ctr_label:"Estimated CTR",
    seo_gain_potential:"SEO Potential Gain",seo_current:"Current score",seo_potential_label:"Potential score",
    seo_action:"Action",seo_gain_col:"Gain",seo_score_col:"Score",seo_total:"Optimized total",
    impact_very_high:"Very High",impact_high:"High",impact_medium:"Medium",impact_low:"Low",
    cl_punct_label:"CTR Punctuation (? or !)",cl_punct_ok:"Engaging punctuation present",
    cl_punct_fix:"No CTR punctuation — add ? or !",
    cl_punct_why:"Titles with ? or ! get +15% more clicks.",cl_punct_gain:"+5 SEO points",
    report_exec:"Executive Summary",report_print:"🖨 Print",report_close:"✕ Close",
    report_seo_full:"Full SEO Analysis",report_thumb_full:"Full Thumbnail Analysis",
    report_viral_full:"Full Viral Analysis",report_comp_full:"Full Competitive Analysis",
    report_titles:"Generated Alternative Titles",report_opportunities:"Detected Opportunities",
    report_actions:"Priority Actions",report_charts:"Score Analysis",
    report_before_after:"Before / After optimization",report_loading:"Generating premium report…",
    report_no_data:"Open this report from VidSpark AI extension on a YouTube video.",
    report_keywords:"Title keywords",report_missing_kw:"Potentially missing keywords",
    report_impact_table:"Estimated SEO impact per fix",
    report_ctr_current:"Estimated current CTR",report_ctr_potential:"Potential CTR",
    report_emotions:"Emotional analysis",report_visual_criteria:"Visual criteria",
    report_opp_subject:"Missing subject",report_opp_kw:"Keywords",
    report_opp_trend:"Trend",report_opp_niche:"Niche",
    report_viral_impact:"Impact of each fix",
    report_comp_note_text:"Real-time competitor analysis available in Pro via YouTube Data API v3.",
    titles_seo_label:"SEO",titles_ctr_label:"CTR",titles_viral_label:"Viral",
    titles_shorts_label:"Shorts",titles_trending_label:"Trending",format_standard:"Standard 16:9 format",
    btn_report:"Generate AI suggestions",rtl:"false",
    seo_tab_analyse:"📊 Analysis",seo_tab_optim:"🎯 Optimization",seo_tab_kw:"🔑 Keywords",
    seo_tab_rec_kw:"Recommended keywords",seo_tab_issues:"issues",seo_all_ok:"All criteria validated!",
    example_label:"Example:",recommendation_label:"RECOMMENDATION:",
    impact_pos_num:"Positive impact +8% estimated CTR",impact_neg_num:"Adding a number can increase CTR by 15–40%",
    viral_pos_hook:"CTR Hook at title start",
    viral_pos_num:"Number in title",
    viral_pos_em:"Emotional word present",
    viral_pos_desc:"Description long enough",
    viral_pos_len:"Optimal title length",
    viral_neg_hook:"No CTR hook — add a question or number at start",
    viral_neg_num:"No number — titles with numbers get +40% CTR",
    viral_neg_em:"No emotional word — add a power word",
    viral_neg_desc_tpl:"Short description (N chars) — aim for 500+",
    viral_neg_len_short:"Title too short",
    viral_neg_len_long:"Title too long",
    viral_potential_title:"Viral potential score",
    btn_viral_ai:"✨ Viral AI Analysis",
    emotion_curiosity:"Curiosity", emotion_surprise:"Surprise",
    emotion_desire:"Desire", emotion_urgency:"Urgency", emotion_trust:"Trust",
    cl_len_why:"Title length directly influences display in YouTube and Google results. Between 55 and 70 characters is ideal.",
    cl_num_why:"Numbers make the title concrete and measurable. The human eye is naturally attracted to numbers.",
    cl_em_why2:"Emotional words trigger an immediate psychological response that pushes to click.",
    cl_hk_why2:"The first 3 words of the title are most read. A question hook creates an open psychological loop.",
    cl_desc_why:"YouTube indexes your description text. A rich description helps the algorithm understand your video.",
    cl_len_s1:"Add niche keywords", cl_len_s2:"Clarify the content", cl_len_s3:"Include main benefit",
    cl_len_r1:"Remove non-essential words", cl_len_r2:"Use abbreviations", cl_len_r3:"Rephrase in one sentence",
    cl_num_s1:"Try: \"5 tips...\"", cl_num_s2:"Try: \"100% free...\"", cl_num_s3:"Try: \"In 10 minutes\"",
    cl_em_s1:"\"Amazing\"", cl_em_s2:"\"Free\"", cl_em_s3:"\"Secret\"", cl_em_s4:"\"Ultimate\"",
    cl_hk_s1:"\"How to...\"", cl_hk_s2:"\"Why...\"", cl_hk_s3:"\"The X best...\"",
    cl_desc_s1:"Add natural keywords", cl_desc_s2:"Include timestamps", cl_desc_s3:"Add links and CTA",
    cl_punct_s1:"Add a question", cl_punct_s2:"Add exclamation at end",
    missing_kw_list:"tutorial,free,complete,2024,beginner,guide",
    comp_opp_label:"Underexploited niches in your topic"
  },
  ar:{
    nav_coach:"🧠 المدرّب", coach_potential:"إمكانات الفيديو", coach_actions:"إجراءات", coach_fix:"أصلح", coach_grow:"اعثر على فكرة فيروسية", coach_a_title:"أصلح عنوانك", coach_w_title_kw:"العنوان يحتاج تحسين SEO", coach_w_title_long:"العنوان طويل جدًا (أكثر من 70 حرفًا)", coach_a_thumb:"حسّن صورتك المصغّرة", coach_w_thumb:"مجال كبير لتحسين الصورة المصغّرة", coach_a_short:"انشر Short عن هذا الموضوع", coach_w_short:"عزّز انتشارك بفيديو Short", coach_ok_title:"العنوان جيد", coach_ok_thumb:"الصورة المصغّرة جيدة", coach_ok_viral:"إمكانات الانتشار جيدة", coach_all_good:"فيديوك محسّن جيدًا بالفعل!", sec_coach:"المدرّب", sec_analyser:"تحليل", sec_creer:"إنشاء", sec_studio:"استوديو", sec_croissance:"النمو",
    nav_overview:"نظرة عامة", nav_seo:"SEO", nav_thumbnail:"الصورة",
    nav_viral:"فيروسي", nav_competitor:"المنافسون", nav_titles:"عناوين AI", nav_actions:"إجراءات",
    score_seo:"نقاط SEO", score_viral:"النقاط الفيروسية",
    score_thumb:"نقاط الصورة", score_competition:"المنافسة",
    score_global:"النقاط الكلية",
    views:"مشاهدة", desc_chars:"حرف وصف", title_chars:"حرف عنوان",
    checklist_title:"قائمة SEO", criteria_ok:"معايير محققة",
    cl_len_label:"طول العنوان", cl_len_ok:n=>`${n} حرف — ممتاز`,
    cl_len_short:n=>`${n} حرف — قصير`, cl_len_long:n=>`${n} حرف — طويل`,
    cl_len_impact_ok:"الطول مثالي لـ YouTube SEO.",
    cl_len_impact_fix:n=>`العنوان ${n} حرف. تأثير SEO: ${n<45?"-15%":"-10%"}. الهدف 55–70 حرف.`,
    cl_num_label:"رقم في العنوان", cl_num_ok:"رقم موجود — تعزيز CTR",
    cl_num_fix:"لا يوجد رقم. العناوين بأرقام لها +40% CTR.",
    cl_em_label:"كلمة عاطفية", cl_em_ok:"كلمة قوية موجودة",
    cl_em_fix:'أضف: "مذهل"، "مجاني"، "سر"، "أفضل"',
    cl_hk_label:"خطاف CTR", cl_hk_ok:"خطاف جيد في بداية العنوان",
    cl_hk_fix:'ابدأ بـ "كيف"، "لماذا"، أو رقم',
    cl_desc_label:"الوصف (300+ حرف)", cl_desc_ok:n=>`${n} حرف — جيد`,
    cl_desc_fix:n=>`${n} حرف — الهدف 500+`,
    seo_title_analysis:"تحليل العنوان", seo_desc_analysis:"تحليل الوصف",
    seo_keywords:"الكلمات المفتاحية", seo_suggestions:"اقتراحات AI",
    seo_impact:"تأثير SEO", seo_recommendation:"التوصية",
    thumb_score:"نقاط الصورة", thumb_preview:"معاينة الصورة",
    thumb_emotions:"التحليل العاطفي", thumb_strengths:"نقاط القوة",
    thumb_weaknesses:"نقاط الضعف", thumb_suggestions:"الاقتراحات",
    thumb_download:"تحميل HD", thumb_copy_url:"نسخ الرابط",
    thumb_face:"وجه موجود", thumb_no_face:"لا يوجد وجه",
    thumb_contrast:"التباين", thumb_text:"وضوح النص",
    thumb_colors:"الألوان", thumb_elements:"العناصر",
    viral_score:"النقاط الفيروسية", viral_probability:"احتمال الانتشار",
    viral_low:"منخفض", viral_medium:"متوسط", viral_high:"مرتفع",
    viral_factors_pos:"العوامل الإيجابية", viral_factors_neg:"العوامل السلبية",
    viral_prediction:"توقع AI", viral_tips:"نصائح للانتشار",
    comp_title:"تحليل المنافسة", comp_position:"موقعك",
    comp_keywords:"كلمات النيش", comp_missing:"كلمات مفقودة",
    comp_opportunities:"الفرص", comp_note:"ملاحظة",
    titles_generate:"🚀 إنشاء 5 عناوين محسّنة",
    titles_seo:"نسخة SEO", titles_ctr:"نسخة CTR",
    titles_viral:"النسخة الفيروسية", titles_shorts:"نسخة Shorts",
    titles_trending:"نسخة الترند",
    titles_copy:"نسخ", titles_score:"النقاط",
    act_copy_title:"📋 نسخ العنوان", act_description:"📝 وصف AI",
    act_tags:"🏷 وسوم AI", act_thumbnail:"🖼 صورة HD",
    act_full_report:"✨ تقرير AI كامل",
    act_copy_desc:"📋 نسخ الوصف", act_copy_tags:"📋 نسخ الوسوم",
    act_desc_label:"وصف AI", act_tags_label:"الوسوم والهاشتاقات",
    act_tags_yt:"وسوم يوتيوب", act_hashtags:"هاشتاقات",
    loading:"جارٍ تحليل AI…", loading_titles:"جارٍ إنشاء العناوين…",
    loading_desc:"جارٍ إنشاء الوصف…", loading_tags:"جارٍ إنشاء الوسوم…",
    error_generic:"خطأ — تحقق من الوكيل", error_no_video:"لم يتم اكتشاف فيديو",
    copied_title:"تم نسخ العنوان ✓", copied_desc:"تم نسخ الوصف ✓",
    copied_tags:"تم نسخ الوسوم ✓", lang_changed:"تم تغيير اللغة",
    plan_free:"مجاني", plan_pro:"برو", plan_business:"أعمال",
    upgrade_msg:"الترقية إلى Pro لفتح جميع ميزات AI",
    upgrade_btn:"الترقية إلى Pro →",

    thumb_good_contrast:"تباين جيد",thumb_bad_contrast:"التباين يحتاج تحسين",
    thumb_good_text:"النص مقروء",thumb_bad_text:"وضوح النص يحتاج تحسين",
    thumb_format:"تنسيق قياسي — مثالي",thumb_face_proxy:"تحليل الوجه يتطلب وكيل",
    thumb_face_ok:"وجه معبر تم اكتشافه",
    thumb_rec1:"إضافة وجه معبر (+38% CTR)",thumb_rec2:"نص كبير، 4–6 كلمات كحد أقصى",
    thumb_rec3:"ألوان دافئة (أحمر/أصفر) على خلفية داكنة",thumb_rec4:"سهم أو دائرة نحو العنصر الرئيسي",
    thumb_current:"الحالي",thumb_potential:"المحتمل",
    thumb_ctr_current:"CTR المقدر الحالي",thumb_ctr_potential:"CTR المحتمل",
    viral_tip1:"النشر بين 14 و17 بالتوقيت المحلي",viral_tip2:"المشاركة خلال أول 30 دقيقة",
    viral_tip3:"إضافة طوابع زمنية في الوصف",viral_tip4:"الرد على أول 10 تعليقات",
    viral_current:"النقاط الحالية",viral_potential_label:"النقاط المحتملة",viral_possible_with:"نقطة ممكنة مع:",
    viral_fix_hook:"خطاف CTR أفضل",viral_fix_emotion:"كلمة عاطفية قوية",
    viral_fix_desc:"وصف محسّن",viral_fix_number:"رقم في العنوان",
    comp_opp1:"فرص غير مستغلة في تخصصك",comp_opp2:"زاوية أصلية غير مغطاة من المنافسين",
    comp_opp3:"تنسيق الفيديو الطويل ممثل تمثيلاً ناقصاً",comp_opp4:"النسخة العربية أقل منافسة",
    comp_pro_note:"تحليل المنافسين في الوقت الفعلي متاح في النسخة Pro.",
    overview_gain_label:"المحتمل إذا تم التصحيح",overview_ctr_label:"CTR المقدر",
    seo_gain_potential:"مكسب SEO المحتمل",seo_current:"النقاط الحالية",seo_potential_label:"النقاط المحتملة",
    seo_action:"الإجراء",seo_gain_col:"المكسب",seo_score_col:"النقاط",seo_total:"الإجمالي المحسّن",
    impact_very_high:"مرتفع جداً",impact_high:"مرتفع",impact_medium:"متوسط",impact_low:"منخفض",
    cl_punct_label:"علامات الترقيم CTR",cl_punct_ok:"علامة ترقيم جذابة موجودة",
    cl_punct_fix:"لا توجد علامات ترقيم — أضف ؟ أو !",
    cl_punct_why:"العناوين بعلامة ؟ تحصل على +15% نقرات.",cl_punct_gain:"+5 نقاط SEO",
    report_exec:"الملخص التنفيذي",report_print:"🖨 طباعة",report_close:"✕ إغلاق",
    report_seo_full:"تحليل SEO كامل",report_thumb_full:"تحليل الصورة المصغرة الكامل",
    report_viral_full:"التحليل الفيروسي الكامل",report_comp_full:"التحليل التنافسي الكامل",
    report_titles:"عناوين بديلة مولدة",report_opportunities:"الفرص المكتشفة",
    report_actions:"الإجراءات ذات الأولوية",report_charts:"تحليل النقاط",
    report_before_after:"قبل / بعد التحسين",report_loading:"جارٍ إنشاء التقرير المميز…",
    report_no_data:"افتح هذا التقرير من إضافة VidSpark AI على فيديو يوتيوب.",
    report_keywords:"كلمات مفتاحية في العنوان",report_missing_kw:"كلمات مفتاحية مفقودة محتملة",
    report_impact_table:"تأثير SEO المقدر لكل تصحيح",
    report_ctr_current:"CTR المقدر الحالي",report_ctr_potential:"CTR المحتمل",
    report_emotions:"التحليل العاطفي",report_visual_criteria:"المعايير البصرية",
    report_opp_subject:"موضوع مفقود",report_opp_kw:"كلمات مفتاحية",
    report_opp_trend:"ترند",report_opp_niche:"نيش",
    report_viral_impact:"تأثير كل تصحيح",
    report_comp_note_text:"تحليل المنافسين في الوقت الفعلي متاح في Pro عبر YouTube Data API v3.",
    titles_seo_label:"SEO",titles_ctr_label:"CTR",titles_viral_label:"فيروسي",
    titles_shorts_label:"Shorts",titles_trending_label:"ترند",format_standard:"تنسيق 16:9 القياسي",
    btn_report:"توليد اقتراحات AI",rtl:"true",
    seo_tab_analyse:"📊 تحليل",seo_tab_optim:"🎯 تحسين",seo_tab_kw:"🔑 كلمات مفتاحية",
    seo_tab_rec_kw:"كلمات مفتاحية مقترحة",seo_tab_issues:"مشاكل",seo_all_ok:"جميع المعايير محققة!",
    example_label:"مثال :",recommendation_label:"التوصيات :",
    impact_pos_num:"تأثير إيجابي +8% CTR",impact_neg_num:"إضافة رقم يمكن أن يزيد CTR بنسبة 15–40%",
    viral_pos_hook:"خطاف CTR في بداية العنوان",
    viral_pos_num:"رقم في العنوان",
    viral_pos_em:"كلمة عاطفية موجودة",
    viral_pos_desc:"الوصف طويل بما يكفي",
    viral_pos_len:"طول العنوان مثالي",
    viral_neg_hook:"لا يوجد خطاف CTR — أضف سؤالاً أو رقماً في البداية",
    viral_neg_num:"لا يوجد رقم — العناوين بأرقام تحصل على +40% CTR",
    viral_neg_em:"لا توجد كلمة عاطفية — أضف كلمة قوية",
    viral_neg_desc_tpl:"وصف قصير (N حرف) — الهدف 500+",
    viral_neg_len_short:"العنوان قصير جداً",
    viral_neg_len_long:"العنوان طويل جداً",
    viral_potential_title:"النقاط الفيروسية المحتملة",
    btn_viral_ai:"✨ تحليل فيروسي AI",
    emotion_curiosity:"فضول", emotion_surprise:"مفاجأة",
    emotion_desire:"رغبة", emotion_urgency:"إلحاح", emotion_trust:"ثقة",
    cl_len_why:"طول العنوان يؤثر مباشرة على الظهور في نتائج يوتيوب وجوجل. 55–70 حرفاً مثالي.",
    cl_num_why:"الأرقام تجعل العنوان ملموساً وقابلاً للقياس.",
    cl_em_why2:"الكلمات العاطفية تثير استجابة نفسية فورية تدفع للنقر.",
    cl_hk_why2:"الكلمات الثلاث الأولى في العنوان هي الأكثر قراءة.",
    cl_desc_why:"يوتيوب يفهرس نص وصفك. وصف غني يساعد الخوارزمية.",
    cl_len_s1:"إضافة كلمات مفتاحية متخصصة", cl_len_s2:"توضيح المحتوى", cl_len_s3:"تضمين الفائدة الرئيسية",
    cl_len_r1:"حذف الكلمات غير الضرورية", cl_len_r2:"استخدام الاختصارات", cl_len_r3:"إعادة الصياغة",
    cl_num_s1:"جرب: \"5 نصائح...\"", cl_num_s2:"جرب: \"100% مجاني...\"", cl_num_s3:"جرب: \"في 10 دقائق\"",
    cl_em_s1:"\"مذهل\"", cl_em_s2:"\"مجاني\"", cl_em_s3:"\"سر\"", cl_em_s4:"\"الأفضل\"",
    cl_hk_s1:"\"كيف...\"", cl_hk_s2:"\"لماذا...\"", cl_hk_s3:"\"أفضل X...\"",
    cl_desc_s1:"إضافة كلمات مفتاحية طبيعية", cl_desc_s2:"تضمين طوابع زمنية", cl_desc_s3:"إضافة روابط",
    cl_punct_s1:"إضافة سؤال", cl_punct_s2:"إضافة علامة تعجب",
    missing_kw_list:"درس,مجاني,كامل,2024,مبتدئ,دليل",
    comp_opp_label:"فرص غير مستغلة في موضوعك"
  },
  es:{
    nav_coach:"🧠 Coach", coach_potential:"Potencial del vídeo", coach_actions:"acciones", coach_fix:"Corregir", coach_grow:"Encuentra una idea viral", coach_a_title:"Corrige tu título", coach_w_title_kw:"El título necesita optimización SEO", coach_w_title_long:"Título demasiado largo (más de 70 caracteres)", coach_a_thumb:"Mejora tu miniatura", coach_w_thumb:"Mucho margen para mejorar la miniatura", coach_a_short:"Publica un Short sobre este tema", coach_w_short:"Aumenta tu potencial viral con un Short", coach_ok_title:"Título OK", coach_ok_thumb:"Miniatura OK", coach_ok_viral:"Potencial viral OK", coach_all_good:"¡Tu vídeo ya está bien optimizado!", sec_coach:"Coach", sec_analyser:"Analizar", sec_creer:"Crear", sec_studio:"Estudio", sec_croissance:"Crecimiento",
    nav_overview:"Vista general", nav_seo:"SEO", nav_thumbnail:"Miniatura",
    nav_viral:"Viral", nav_competitor:"Competidores", nav_titles:"Títulos IA", nav_actions:"Acciones",
    score_seo:"Puntuación SEO", score_viral:"Puntuación Viral",
    score_thumb:"Puntuación Miniatura", score_competition:"Competencia",
    score_global:"Puntuación Global",
    views:"vistas", desc_chars:"car. descripción", title_chars:"car. título",
    checklist_title:"Lista SEO", criteria_ok:"criterios validados",
    cl_len_label:"Longitud título", cl_len_ok:n=>`${n} car. — perfecto`,
    cl_len_short:n=>`${n} car. — muy corto`, cl_len_long:n=>`${n} car. — muy largo`,
    cl_len_impact_ok:"Longitud óptima para SEO de YouTube.",
    cl_len_impact_fix:n=>`Título de ${n} car. Impacto SEO: ${n<45?"-15%":"-10%"}. Objetivo 55–70 car.`,
    cl_num_label:"Número en título", cl_num_ok:"Número detectado — boost CTR",
    cl_num_fix:"Sin número. Los títulos con números tienen +40% CTR.",
    cl_em_label:"Palabra emocional", cl_em_ok:"Palabra fuerte detectada",
    cl_em_fix:'Añadir: "Increíble", "Gratis", "Secreto", "Definitivo"',
    cl_hk_label:"Hook CTR", cl_hk_ok:"Buen hook al inicio",
    cl_hk_fix:'Empezar con "Cómo", "Por qué", o un número',
    cl_desc_label:"Descripción (300+ car.)", cl_desc_ok:n=>`${n} car. — buena`,
    cl_desc_fix:n=>`${n} car. — objetivo 500+`,
    seo_title_analysis:"Análisis título", seo_desc_analysis:"Análisis descripción",
    seo_keywords:"Palabras clave detectadas", seo_suggestions:"Sugerencias IA",
    seo_impact:"Impacto SEO", seo_recommendation:"Recomendación",
    thumb_score:"Puntuación Miniatura", thumb_preview:"Vista previa miniatura",
    thumb_emotions:"Análisis emocional", thumb_strengths:"Fortalezas",
    thumb_weaknesses:"Debilidades", thumb_suggestions:"Sugerencias",
    thumb_download:"Descargar HD", thumb_copy_url:"Copiar URL",
    thumb_face:"Cara detectada", thumb_no_face:"Sin cara",
    thumb_contrast:"Contraste", thumb_text:"Legibilidad",
    thumb_colors:"Colores", thumb_elements:"Elementos",
    viral_score:"Puntuación Viral", viral_probability:"Probabilidad viral",
    viral_low:"Baja", viral_medium:"Media", viral_high:"Alta",
    viral_factors_pos:"Factores positivos", viral_factors_neg:"Factores limitantes",
    viral_prediction:"Predicción IA", viral_tips:"Consejos para maximizar",
    comp_title:"Análisis Competitivo", comp_position:"Tu posición",
    comp_keywords:"Palabras clave de nicho", comp_missing:"Palabras clave faltantes",
    comp_opportunities:"Oportunidades", comp_note:"Nota",
    titles_generate:"🚀 Generar 5 títulos optimizados",
    titles_seo:"Versión SEO", titles_ctr:"Versión CTR",
    titles_viral:"Versión Viral", titles_shorts:"Versión Shorts",
    titles_trending:"Versión Trending",
    titles_copy:"Copiar", titles_score:"Puntuación",
    act_copy_title:"📋 Copiar título", act_description:"📝 Descripción IA",
    act_tags:"🏷 Tags IA", act_thumbnail:"🖼 Miniatura HD",
    act_full_report:"✨ Informe IA completo",
    act_copy_desc:"📋 Copiar descripción", act_copy_tags:"📋 Copiar todos los tags",
    act_desc_label:"Descripción IA", act_tags_label:"Tags y Hashtags IA",
    act_tags_yt:"Tags YouTube", act_hashtags:"Hashtags",
    loading:"Análisis IA en curso…", loading_titles:"Generando títulos…",
    loading_desc:"Generando descripción…", loading_tags:"Generando tags…",
    error_generic:"Error — verificar proxy", error_no_video:"No se detectó video",
    copied_title:"Título copiado ✓", copied_desc:"Descripción copiada ✓",
    copied_tags:"Tags copiados ✓", lang_changed:"Idioma cambiado",
    plan_free:"Gratis", plan_pro:"Pro", plan_business:"Business",
    upgrade_msg:"Actualizar a Pro para desbloquear todas las funciones IA",
    upgrade_btn:"Actualizar a Pro →",

    thumb_good_contrast:"Buen contraste detectado",thumb_bad_contrast:"El contraste necesita mejorar",
    thumb_good_text:"Texto legible estimado",thumb_bad_text:"Legibilidad necesita mejorar",
    thumb_format:"Formato estándar — óptimo",thumb_face_proxy:"Análisis de cara requiere proxy IA",
    thumb_face_ok:"Cara expresiva detectada",
    thumb_rec1:"Agregar cara expresiva (+38% CTR)",thumb_rec2:"Texto grande, máx 4–6 palabras",
    thumb_rec3:"Colores cálidos (rojo/amarillo) sobre fondo oscuro",thumb_rec4:"Flecha o círculo hacia el elemento principal",
    thumb_current:"Actual",thumb_potential:"Potencial",
    thumb_ctr_current:"CTR estimado actual",thumb_ctr_potential:"CTR potencial",
    viral_tip1:"Publicar entre 14h–17h hora local",viral_tip2:"Compartir en los primeros 30 minutos",
    viral_tip3:"Agregar marcas de tiempo en descripción",viral_tip4:"Responder los primeros 10 comentarios",
    viral_current:"Puntuación actual",viral_potential_label:"Puntuación potencial",viral_possible_with:"pts posibles con:",
    viral_fix_hook:"Mejor hook CTR",viral_fix_emotion:"Palabra emocional fuerte",
    viral_fix_desc:"Descripción optimizada",viral_fix_number:"Número en el título",
    comp_opp1:"Nichos sin explotar en su tema",comp_opp2:"Ángulo original no cubierto por competidores",
    comp_opp3:"Formato largo infrarrepresentado en este tema",comp_opp4:"Versión en español menos competitiva",
    comp_pro_note:"Análisis de competidores en tiempo real disponible en versión Pro.",
    overview_gain_label:"Potencial si se corrige",overview_ctr_label:"CTR estimado",
    seo_gain_potential:"Ganancia SEO potencial",seo_current:"Puntuación actual",seo_potential_label:"Puntuación potencial",
    seo_action:"Acción",seo_gain_col:"Ganancia",seo_score_col:"Puntuación",seo_total:"Total optimizado",
    impact_very_high:"Muy Alto",impact_high:"Alto",impact_medium:"Medio",impact_low:"Bajo",
    cl_punct_label:"Puntuación CTR (? o !)",cl_punct_ok:"Puntuación atractiva presente",
    cl_punct_fix:"Sin puntuación CTR — agregar ? o !",
    cl_punct_why:"Los títulos con ? o ! obtienen +15% de clics.",cl_punct_gain:"+5 puntos SEO",
    report_exec:"Resumen Ejecutivo",report_print:"🖨 Imprimir",report_close:"✕ Cerrar",
    report_seo_full:"Análisis SEO completo",report_thumb_full:"Análisis de miniatura completo",
    report_viral_full:"Análisis viral completo",report_comp_full:"Análisis competitivo completo",
    report_titles:"Títulos alternativos generados",report_opportunities:"Oportunidades detectadas",
    report_actions:"Acciones prioritarias",report_charts:"Análisis de puntuaciones",
    report_before_after:"Antes / Después de optimizar",report_loading:"Generando informe premium…",
    report_no_data:"Abre este informe desde la extensión VidSpark AI en un video de YouTube.",
    report_keywords:"Palabras clave del título",report_missing_kw:"Palabras clave potencialmente faltantes",
    report_impact_table:"Impacto SEO estimado por corrección",
    report_ctr_current:"CTR estimado actual",report_ctr_potential:"CTR potencial",
    report_emotions:"Análisis emocional",report_visual_criteria:"Criterios visuales",
    report_opp_subject:"Tema faltante",report_opp_kw:"Palabras clave",
    report_opp_trend:"Tendencia",report_opp_niche:"Nicho",
    report_viral_impact:"Impacto de cada corrección",
    report_comp_note_text:"El análisis de competidores en tiempo real está disponible en Pro vía YouTube Data API v3.",
    titles_seo_label:"SEO",titles_ctr_label:"CTR",titles_viral_label:"Viral",
    titles_shorts_label:"Shorts",titles_trending_label:"Trending",format_standard:"Formato estándar 16:9",
    btn_report:"Generar sugerencias IA",rtl:"false",
    seo_tab_analyse:"📊 Análisis",seo_tab_optim:"🎯 Optimización",seo_tab_kw:"🔑 Palabras clave",
    seo_tab_rec_kw:"Palabras clave recomendadas",seo_tab_issues:"problemas",seo_all_ok:"¡Todos los criterios validados!",
    example_label:"Ejemplo:",recommendation_label:"RECOMENDACIÓN:",
    impact_pos_num:"Impacto positivo +8% CTR estimado",impact_neg_num:"Agregar un número puede aumentar el CTR en 15–40%",
    viral_pos_hook:"Hook CTR al inicio del título",
    viral_pos_num:"Número en el título",
    viral_pos_em:"Palabra emocional presente",
    viral_pos_desc:"Descripción suficientemente larga",
    viral_pos_len:"Longitud de título óptima",
    viral_neg_hook:"Sin hook CTR — agrega una pregunta o número al inicio",
    viral_neg_num:"Sin número — títulos con números obtienen +40% CTR",
    viral_neg_em:"Sin palabra emocional — agrega una palabra fuerte",
    viral_neg_desc_tpl:"Descripción corta (N car.) — objetivo 500+",
    viral_neg_len_short:"Título demasiado corto",
    viral_neg_len_long:"Título demasiado largo",
    viral_potential_title:"Puntuación viral potencial",
    btn_viral_ai:"✨ Análisis viral IA",
    emotion_curiosity:"Curiosidad", emotion_surprise:"Sorpresa",
    emotion_desire:"Deseo", emotion_urgency:"Urgencia", emotion_trust:"Confianza",
    cl_len_why:"La longitud del título influye directamente en los resultados de YouTube y Google. 55–70 caracteres es ideal.",
    cl_num_why:"Los números hacen el título concreto. El ojo humano se atrae por los números.",
    cl_em_why2:"Las palabras emocionales desencadenan una respuesta que impulsa a hacer clic.",
    cl_hk_why2:"Las primeras 3 palabras del título son las más leídas.",
    cl_desc_why:"YouTube indexa tu descripción. Una descripción rica ayuda al algoritmo.",
    cl_len_s1:"Agregar palabras clave de nicho", cl_len_s2:"Precisar el contenido", cl_len_s3:"Incluir el beneficio",
    cl_len_r1:"Eliminar palabras no esenciales", cl_len_r2:"Usar abreviaciones", cl_len_r3:"Reformular en una frase",
    cl_num_s1:"Probar: \"5 consejos...\"", cl_num_s2:"Probar: \"100% gratis...\"", cl_num_s3:"Probar: \"En 10 minutos\"",
    cl_em_s1:"\"Increíble\"", cl_em_s2:"\"Gratis\"", cl_em_s3:"\"Secreto\"", cl_em_s4:"\"Definitivo\"",
    cl_hk_s1:"\"Cómo...\"", cl_hk_s2:"\"Por qué...\"", cl_hk_s3:"\"Los X mejores...\"",
    cl_desc_s1:"Agregar palabras clave naturales", cl_desc_s2:"Incluir marcas de tiempo", cl_desc_s3:"Agregar CTA",
    cl_punct_s1:"Agregar una pregunta", cl_punct_s2:"Agregar exclamación al final",
    missing_kw_list:"tutorial,gratis,completo,2024,principiante,guía",
    comp_opp_label:"Nichos sin explotar en tu tema"
  },
  de:{
    nav_coach:"🧠 Coach", coach_potential:"Video-Potenzial", coach_actions:"Aktionen", coach_fix:"Beheben", coach_grow:"Finde eine virale Idee", coach_a_title:"Korrigiere deinen Titel", coach_w_title_kw:"Titel braucht SEO-Optimierung", coach_w_title_long:"Titel zu lang (über 70 Zeichen)", coach_a_thumb:"Verbessere dein Thumbnail", coach_w_thumb:"Viel Spielraum zur Verbesserung des Thumbnails", coach_a_short:"Poste einen Short zu diesem Thema", coach_w_short:"Steigere dein virales Potenzial mit einem Short", coach_ok_title:"Titel OK", coach_ok_thumb:"Thumbnail OK", coach_ok_viral:"Virales Potenzial OK", coach_all_good:"Dein Video ist bereits gut optimiert!", sec_coach:"Coach", sec_analyser:"Analysieren", sec_creer:"Erstellen", sec_studio:"Studio", sec_croissance:"Wachstum",
    nav_overview:"Übersicht", nav_seo:"SEO", nav_thumbnail:"Vorschaubild",
    nav_viral:"Viral", nav_competitor:"Konkurrenz", nav_titles:"KI-Titel", nav_actions:"Aktionen",
    score_seo:"SEO-Punktzahl", score_viral:"Viral-Score",
    score_thumb:"Vorschaubild-Score", score_competition:"Konkurrenz",
    score_global:"Gesamt-Score",
    views:"Aufrufe", desc_chars:"Z. Beschreibung", title_chars:"Z. Titel",
    checklist_title:"SEO-Checkliste", criteria_ok:"Kriterien erfüllt",
    cl_len_label:"Titellänge", cl_len_ok:n=>`${n} Zeichen — perfekt`,
    cl_len_short:n=>`${n} Zeichen — zu kurz`, cl_len_long:n=>`${n} Zeichen — zu lang`,
    cl_len_impact_ok:"Optimale Länge für YouTube-SEO.",
    cl_len_impact_fix:n=>`Titel hat ${n} Zeichen. SEO-Auswirkung: ${n<45?"-15%":"-10%"}. Ziel: 55–70 Zeichen.`,
    cl_num_label:"Zahl im Titel", cl_num_ok:"Zahl erkannt — CTR-Boost",
    cl_num_fix:"Keine Zahl. Titel mit Zahlen haben +40% CTR.",
    cl_em_label:"Emotionales Wort", cl_em_ok:"Kraftwort erkannt",
    cl_em_fix:'Hinzufügen: "Unglaublich", "Kostenlos", "Geheimnis"',
    cl_hk_label:"CTR-Hook", cl_hk_ok:"Guter Hook am Titelanfang",
    cl_hk_fix:'Mit "Wie", "Warum" oder einer Zahl beginnen',
    cl_desc_label:"Beschreibung (300+ Z.)", cl_desc_ok:n=>`${n} Zeichen — gut`,
    cl_desc_fix:n=>`${n} Zeichen — Ziel 500+`,
    seo_title_analysis:"Titelanalyse", seo_desc_analysis:"Beschreibungsanalyse",
    seo_keywords:"Erkannte Keywords", seo_suggestions:"KI-Vorschläge",
    seo_impact:"SEO-Auswirkung", seo_recommendation:"Empfehlung",
    thumb_score:"Vorschaubild-Score", thumb_preview:"Vorschaubild",
    thumb_emotions:"Emotionsanalyse", thumb_strengths:"Stärken",
    thumb_weaknesses:"Schwächen", thumb_suggestions:"Vorschläge",
    thumb_download:"HD herunterladen", thumb_copy_url:"URL kopieren",
    thumb_face:"Gesicht erkannt", thumb_no_face:"Kein Gesicht",
    thumb_contrast:"Kontrast", thumb_text:"Textlesbarkeit",
    thumb_colors:"Farben", thumb_elements:"Elemente",
    viral_score:"Viral-Score", viral_probability:"Virale Wahrscheinlichkeit",
    viral_low:"Niedrig", viral_medium:"Mittel", viral_high:"Hoch",
    viral_factors_pos:"Positive Faktoren", viral_factors_neg:"Einschränkende Faktoren",
    viral_prediction:"KI-Vorhersage", viral_tips:"Tipps zur Maximierung",
    comp_title:"Wettbewerbsanalyse", comp_position:"Ihre Position",
    comp_keywords:"Nischen-Keywords", comp_missing:"Fehlende Keywords",
    comp_opportunities:"Chancen", comp_note:"Hinweis",
    titles_generate:"🚀 5 optimierte Titel erstellen",
    titles_seo:"SEO-Version", titles_ctr:"CTR-Version",
    titles_viral:"Virale Version", titles_shorts:"Shorts-Version",
    titles_trending:"Trending-Version",
    titles_copy:"Kopieren", titles_score:"Punktzahl",
    act_copy_title:"📋 Titel kopieren", act_description:"📝 KI-Beschreibung",
    act_tags:"🏷 KI-Tags", act_thumbnail:"🖼 HD-Vorschaubild",
    act_full_report:"✨ Vollständiger KI-Bericht",
    act_copy_desc:"📋 Beschreibung kopieren", act_copy_tags:"📋 Alle Tags kopieren",
    act_desc_label:"KI-Beschreibung", act_tags_label:"KI-Tags und Hashtags",
    act_tags_yt:"YouTube-Tags", act_hashtags:"Hashtags",
    loading:"KI-Analyse läuft…", loading_titles:"Titel werden generiert…",
    loading_desc:"Beschreibung wird generiert…", loading_tags:"Tags werden generiert…",
    error_generic:"Fehler — Proxy prüfen", error_no_video:"Kein Video erkannt",
    copied_title:"Titel kopiert ✓", copied_desc:"Beschreibung kopiert ✓",
    copied_tags:"Tags kopiert ✓", lang_changed:"Sprache geändert",
    plan_free:"Kostenlos", plan_pro:"Pro", plan_business:"Business",
    upgrade_msg:"Auf Pro upgraden für alle KI-Funktionen",
    upgrade_btn:"Auf Pro upgraden →",

    thumb_good_contrast:"Guter Kontrast erkannt",thumb_bad_contrast:"Kontrast muss verbessert werden",
    thumb_good_text:"Text lesbar geschätzt",thumb_bad_text:"Lesbarkeit muss verbessert werden",
    thumb_format:"Standardformat — optimal",thumb_face_proxy:"KI-Gesichtserkennung erfordert Proxy",
    thumb_face_ok:"Ausdrucksstarkes Gesicht erkannt",
    thumb_rec1:"Ausdrucksstarkes Gesicht hinzufügen (+38% CTR)",thumb_rec2:"Großer Text, max. 4–6 Wörter",
    thumb_rec3:"Warme Farben (Rot/Gelb) auf dunklem Hintergrund",thumb_rec4:"Pfeil oder Kreis zum Hauptelement",
    thumb_current:"Aktuell",thumb_potential:"Potenzial",
    thumb_ctr_current:"Geschätzter aktueller CTR",thumb_ctr_potential:"Potenzieller CTR",
    viral_tip1:"Zwischen 14–17 Uhr Ortszeit veröffentlichen",viral_tip2:"In den ersten 30 Minuten teilen",
    viral_tip3:"Zeitstempel in Beschreibung einfügen",viral_tip4:"Auf die ersten 10 Kommentare antworten",
    viral_current:"Aktueller Wert",viral_potential_label:"Potenzieller Wert",viral_possible_with:"Punkte möglich mit:",
    viral_fix_hook:"Besserer CTR-Hook",viral_fix_emotion:"Starkes emotionales Wort",
    viral_fix_desc:"Optimierte Beschreibung",viral_fix_number:"Zahl im Titel",
    comp_opp1:"Unausgeschöpfte Nischen in Ihrem Thema",comp_opp2:"Originaler Winkel nicht von Konkurrenten abgedeckt",
    comp_opp3:"Langformat auf diesem Thema unterrepräsentiert",comp_opp4:"Deutsche Version weniger wettbewerbsfähig",
    comp_pro_note:"Echtzeit-Konkurrenzanalyse in der Pro-Version verfügbar.",
    overview_gain_label:"Potenzial wenn korrigiert",overview_ctr_label:"Geschätzter CTR",
    seo_gain_potential:"SEO-Potenzialgewinn",seo_current:"Aktueller Wert",seo_potential_label:"Potenzieller Wert",
    seo_action:"Aktion",seo_gain_col:"Gewinn",seo_score_col:"Punktzahl",seo_total:"Optimiertes Gesamt",
    impact_very_high:"Sehr Hoch",impact_high:"Hoch",impact_medium:"Mittel",impact_low:"Niedrig",
    cl_punct_label:"CTR-Satzzeichen (? oder !)",cl_punct_ok:"Ansprechende Interpunktion vorhanden",
    cl_punct_fix:"Keine CTR-Interpunktion — ? oder ! hinzufügen",
    cl_punct_why:"Titel mit ? oder ! erhalten +15% mehr Klicks.",cl_punct_gain:"+5 SEO-Punkte",
    report_exec:"Zusammenfassung",report_print:"🖨 Drucken",report_close:"✕ Schließen",
    report_seo_full:"Vollständige SEO-Analyse",report_thumb_full:"Vollständige Vorschaubild-Analyse",
    report_viral_full:"Vollständige Viral-Analyse",report_comp_full:"Vollständige Wettbewerbsanalyse",
    report_titles:"Generierte alternative Titel",report_opportunities:"Erkannte Chancen",
    report_actions:"Prioritätsmaßnahmen",report_charts:"Score-Analyse",
    report_before_after:"Vor / Nach Optimierung",report_loading:"Premium-Bericht wird erstellt…",
    report_no_data:"Öffnen Sie diesen Bericht aus der VidSpark AI-Erweiterung auf einem YouTube-Video.",
    report_keywords:"Titel-Keywords",report_missing_kw:"Potenziell fehlende Keywords",
    report_impact_table:"Geschätzter SEO-Einfluss pro Korrektur",
    report_ctr_current:"Geschätzter aktueller CTR",report_ctr_potential:"Potenzieller CTR",
    report_emotions:"Emotionsanalyse",report_visual_criteria:"Visuelle Kriterien",
    report_opp_subject:"Fehlendes Thema",report_opp_kw:"Keywords",
    report_opp_trend:"Trend",report_opp_niche:"Nische",
    report_viral_impact:"Auswirkung jeder Korrektur",
    report_comp_note_text:"Echtzeit-Konkurrenzanalyse in Pro via YouTube Data API v3.",
    titles_seo_label:"SEO",titles_ctr_label:"CTR",titles_viral_label:"Viral",
    titles_shorts_label:"Shorts",titles_trending_label:"Trending",format_standard:"Standard-16:9-Format",
    btn_report:"KI-Vorschläge generieren",rtl:"false",
    seo_tab_analyse:"📊 Analyse",seo_tab_optim:"🎯 Optimierung",seo_tab_kw:"🔑 Keywords",
    seo_tab_rec_kw:"Empfohlene Keywords",seo_tab_issues:"Probleme",seo_all_ok:"Alle Kriterien validiert!",
    example_label:"Beispiel:",recommendation_label:"EMPFEHLUNG:",
    impact_pos_num:"Positiver Einfluss +8% geschätzter CTR",impact_neg_num:"Eine Zahl kann den CTR um 15–40% steigern",
    viral_pos_hook:"CTR-Hook am Titelanfang",
    viral_pos_num:"Zahl im Titel",
    viral_pos_em:"Emotionales Wort vorhanden",
    viral_pos_desc:"Beschreibung lang genug",
    viral_pos_len:"Optimale Titellänge",
    viral_neg_hook:"Kein CTR-Hook — Frage oder Zahl am Anfang einfügen",
    viral_neg_num:"Keine Zahl — Titel mit Zahlen erhalten +40% CTR",
    viral_neg_em:"Kein emotionales Wort — Kraftwort hinzufügen",
    viral_neg_desc_tpl:"Kurze Beschreibung (N Zeichen) — Ziel 500+",
    viral_neg_len_short:"Titel zu kurz",
    viral_neg_len_long:"Titel zu lang",
    viral_potential_title:"Virales Potenzial",
    btn_viral_ai:"✨ Virale KI-Analyse",
    emotion_curiosity:"Neugier", emotion_surprise:"Überraschung",
    emotion_desire:"Verlangen", emotion_urgency:"Dringlichkeit", emotion_trust:"Vertrauen",
    cl_len_why:"Die Titellänge beeinflusst die Anzeige in YouTube- und Google-Ergebnissen. 55–70 Zeichen ist ideal.",
    cl_num_why:"Zahlen machen den Titel konkret. Das menschliche Auge wird von Zahlen angezogen.",
    cl_em_why2:"Emotionale Wörter lösen eine sofortige Reaktion aus, die zum Klicken animiert.",
    cl_hk_why2:"Die ersten 3 Wörter des Titels werden am meisten gelesen.",
    cl_desc_why:"YouTube indiziert Ihre Beschreibung. Eine umfangreiche Beschreibung hilft dem Algorithmus.",
    cl_len_s1:"Nischen-Keywords hinzufügen", cl_len_s2:"Inhalt präzisieren", cl_len_s3:"Hauptnutzen einbeziehen",
    cl_len_r1:"Unnötige Wörter entfernen", cl_len_r2:"Abkürzungen verwenden", cl_len_r3:"In einem Satz umformulieren",
    cl_num_s1:"Versuchen: \"5 Tipps...\"", cl_num_s2:"Versuchen: \"100% kostenlos...\"", cl_num_s3:"Versuchen: \"In 10 Minuten\"",
    cl_em_s1:"\"Unglaublich\"", cl_em_s2:"\"Kostenlos\"", cl_em_s3:"\"Geheimnis\"", cl_em_s4:"\"Ultimativ\"",
    cl_hk_s1:"\"Wie...\"", cl_hk_s2:"\"Warum...\"", cl_hk_s3:"\"Die X besten...\"",
    cl_desc_s1:"Natürliche Keywords hinzufügen", cl_desc_s2:"Zeitstempel einfügen", cl_desc_s3:"Links und CTA",
    cl_punct_s1:"Frage hinzufügen", cl_punct_s2:"Ausrufezeichen am Ende",
    missing_kw_list:"Tutorial,kostenlos,komplett,2024,Anfänger,Anleitung",
    comp_opp_label:"Ungenutzte Nischen in Ihrem Thema"
  },
  pt:{
    nav_coach:"🧠 Coach", coach_potential:"Potencial do vídeo", coach_actions:"ações", coach_fix:"Corrigir", coach_grow:"Encontre uma ideia viral", coach_a_title:"Corrija seu título", coach_w_title_kw:"O título precisa de otimização de SEO", coach_w_title_long:"Título muito longo (mais de 70 caracteres)", coach_a_thumb:"Melhore sua miniatura", coach_w_thumb:"Grande margem para melhorar a miniatura", coach_a_short:"Publique um Short sobre este tema", coach_w_short:"Aumente seu potencial viral com um Short", coach_ok_title:"Título OK", coach_ok_thumb:"Miniatura OK", coach_ok_viral:"Potencial viral OK", coach_all_good:"Seu vídeo já está bem otimizado!", sec_coach:"Coach", sec_analyser:"Analisar", sec_creer:"Criar", sec_studio:"Estúdio", sec_croissance:"Crescimento",
    nav_overview:"Visão geral", nav_seo:"SEO", nav_thumbnail:"Miniatura",
    nav_viral:"Viral", nav_competitor:"Concorrentes", nav_titles:"Títulos IA", nav_actions:"Ações",
    score_seo:"Pontuação SEO", score_viral:"Pontuação Viral",
    score_thumb:"Pontuação Miniatura", score_competition:"Concorrência",
    score_global:"Pontuação Global",
    views:"visualizações", desc_chars:"car. descrição", title_chars:"car. título",
    checklist_title:"Lista SEO", criteria_ok:"critérios validados",
    cl_len_label:"Comprimento título", cl_len_ok:n=>`${n} car. — perfeito`,
    cl_len_short:n=>`${n} car. — muito curto`, cl_len_long:n=>`${n} car. — muito longo`,
    cl_len_impact_ok:"Comprimento ótimo para SEO do YouTube.",
    cl_len_impact_fix:n=>`Título de ${n} car. Impacto SEO: ${n<45?"-15%":"-10%"}. Alvo 55–70 car.`,
    cl_num_label:"Número no título", cl_num_ok:"Número detectado — boost CTR",
    cl_num_fix:"Sem número. Títulos com números têm +40% CTR.",
    cl_em_label:"Palavra emocional", cl_em_ok:"Palavra forte detectada",
    cl_em_fix:'Adicionar: "Incrível", "Grátis", "Segredo", "Definitivo"',
    cl_hk_label:"Hook CTR", cl_hk_ok:"Bom hook no início",
    cl_hk_fix:'Começar com "Como", "Por que", ou número',
    cl_desc_label:"Descrição (300+ car.)", cl_desc_ok:n=>`${n} car. — boa`,
    cl_desc_fix:n=>`${n} car. — alvo 500+`,
    seo_title_analysis:"Análise do título", seo_desc_analysis:"Análise da descrição",
    seo_keywords:"Palavras-chave detectadas", seo_suggestions:"Sugestões IA",
    seo_impact:"Impacto SEO", seo_recommendation:"Recomendação",
    thumb_score:"Pontuação Miniatura", thumb_preview:"Prévia da miniatura",
    thumb_emotions:"Análise emocional", thumb_strengths:"Pontos fortes",
    thumb_weaknesses:"Pontos fracos", thumb_suggestions:"Sugestões",
    thumb_download:"Baixar HD", thumb_copy_url:"Copiar URL",
    thumb_face:"Rosto detectado", thumb_no_face:"Sem rosto",
    thumb_contrast:"Contraste", thumb_text:"Legibilidade",
    thumb_colors:"Cores", thumb_elements:"Elementos",
    viral_score:"Pontuação Viral", viral_probability:"Probabilidade viral",
    viral_low:"Baixa", viral_medium:"Média", viral_high:"Alta",
    viral_factors_pos:"Fatores positivos", viral_factors_neg:"Fatores limitantes",
    viral_prediction:"Previsão IA", viral_tips:"Dicas para maximizar",
    comp_title:"Análise Competitiva", comp_position:"Sua posição",
    comp_keywords:"Palavras-chave do nicho", comp_missing:"Palavras-chave ausentes",
    comp_opportunities:"Oportunidades", comp_note:"Nota",
    titles_generate:"🚀 Gerar 5 títulos otimizados",
    titles_seo:"Versão SEO", titles_ctr:"Versão CTR",
    titles_viral:"Versão Viral", titles_shorts:"Versão Shorts",
    titles_trending:"Versão Trending",
    titles_copy:"Copiar", titles_score:"Pontuação",
    act_copy_title:"📋 Copiar título", act_description:"📝 Descrição IA",
    act_tags:"🏷 Tags IA", act_thumbnail:"🖼 Miniatura HD",
    act_full_report:"✨ Relatório IA completo",
    act_copy_desc:"📋 Copiar descrição", act_copy_tags:"📋 Copiar todas as tags",
    act_desc_label:"Descrição IA", act_tags_label:"Tags e Hashtags IA",
    act_tags_yt:"Tags YouTube", act_hashtags:"Hashtags",
    loading:"Análise IA em curso…", loading_titles:"Gerando títulos…",
    loading_desc:"Gerando descrição…", loading_tags:"Gerando tags…",
    error_generic:"Erro — verificar proxy", error_no_video:"Nenhum vídeo detectado",
    copied_title:"Título copiado ✓", copied_desc:"Descrição copiada ✓",
    copied_tags:"Tags copiadas ✓", lang_changed:"Idioma alterado",
    plan_free:"Gratuito", plan_pro:"Pro", plan_business:"Business",
    upgrade_msg:"Atualizar para Pro para desbloquear recursos de IA",
    upgrade_btn:"Atualizar para Pro →",

    thumb_good_contrast:"Bom contraste detectado",thumb_bad_contrast:"Contraste precisa de melhoria",
    thumb_good_text:"Texto legível estimado",thumb_bad_text:"Legibilidade precisa de melhoria",
    thumb_format:"Formato padrão — ideal",thumb_face_proxy:"Análise de rosto requer proxy IA",
    thumb_face_ok:"Rosto expressivo detectado",
    thumb_rec1:"Adicionar rosto expressivo (+38% CTR)",thumb_rec2:"Texto grande, máx 4–6 palavras",
    thumb_rec3:"Cores quentes (vermelho/amarelo) em fundo escuro",thumb_rec4:"Seta ou círculo para o elemento principal",
    thumb_current:"Atual",thumb_potential:"Potencial",
    thumb_ctr_current:"CTR estimado atual",thumb_ctr_potential:"CTR potencial",
    viral_tip1:"Publicar entre 14h–17h horário local",viral_tip2:"Compartilhar nos primeiros 30 minutos",
    viral_tip3:"Adicionar timestamps na descrição",viral_tip4:"Responder os primeiros 10 comentários",
    viral_current:"Pontuação atual",viral_potential_label:"Pontuação potencial",viral_possible_with:"pts possíveis com:",
    viral_fix_hook:"Melhor hook CTR",viral_fix_emotion:"Palavra emocional forte",
    viral_fix_desc:"Descrição otimizada",viral_fix_number:"Número no título",
    comp_opp1:"Nichos inexplorados em seu tema",comp_opp2:"Ângulo original não coberto pelos concorrentes",
    comp_opp3:"Formato longo sub-representado neste tema",comp_opp4:"Versão em português menos competitiva",
    comp_pro_note:"Análise de concorrentes em tempo real disponível na versão Pro.",
    overview_gain_label:"Potencial se corrigido",overview_ctr_label:"CTR estimado",
    seo_gain_potential:"Ganho SEO potencial",seo_current:"Pontuação atual",seo_potential_label:"Pontuação potencial",
    seo_action:"Ação",seo_gain_col:"Ganho",seo_score_col:"Pontuação",seo_total:"Total otimizado",
    impact_very_high:"Muito Alto",impact_high:"Alto",impact_medium:"Médio",impact_low:"Baixo",
    cl_punct_label:"Pontuação CTR (? ou !)",cl_punct_ok:"Pontuação atraente presente",
    cl_punct_fix:"Sem pontuação CTR — adicionar ? ou !",
    cl_punct_why:"Títulos com ? ou ! obtêm +15% de cliques.",cl_punct_gain:"+5 pontos SEO",
    report_exec:"Resumo Executivo",report_print:"🖨 Imprimir",report_close:"✕ Fechar",
    report_seo_full:"Análise SEO completa",report_thumb_full:"Análise de miniatura completa",
    report_viral_full:"Análise viral completa",report_comp_full:"Análise competitiva completa",
    report_titles:"Títulos alternativos gerados",report_opportunities:"Oportunidades detectadas",
    report_actions:"Ações prioritárias",report_charts:"Análise de pontuações",
    report_before_after:"Antes / Depois de otimizar",report_loading:"Gerando relatório premium…",
    report_no_data:"Abra este relatório a partir da extensão VidSpark AI em um vídeo do YouTube.",
    report_keywords:"Palavras-chave do título",report_missing_kw:"Palavras-chave potencialmente ausentes",
    report_impact_table:"Impacto SEO estimado por correção",
    report_ctr_current:"CTR estimado atual",report_ctr_potential:"CTR potencial",
    report_emotions:"Análise emocional",report_visual_criteria:"Critérios visuais",
    report_opp_subject:"Assunto ausente",report_opp_kw:"Palavras-chave",
    report_opp_trend:"Tendência",report_opp_niche:"Nicho",
    report_viral_impact:"Impacto de cada correção",
    report_comp_note_text:"Análise de concorrentes em tempo real disponível no Pro via YouTube Data API v3.",
    titles_seo_label:"SEO",titles_ctr_label:"CTR",titles_viral_label:"Viral",
    titles_shorts_label:"Shorts",titles_trending_label:"Trending",format_standard:"Formato padrão 16:9",
    btn_report:"Gerar sugestões IA",rtl:"false",
    seo_tab_analyse:"📊 Análise",seo_tab_optim:"🎯 Otimização",seo_tab_kw:"🔑 Palavras-chave",
    seo_tab_rec_kw:"Palavras-chave recomendadas",seo_tab_issues:"problemas",seo_all_ok:"Todos os critérios validados!",
    example_label:"Exemplo:",recommendation_label:"RECOMENDAÇÃO:",
    impact_pos_num:"Impacto positivo +8% CTR estimado",impact_neg_num:"Adicionar um número pode aumentar o CTR em 15–40%",
    viral_pos_hook:"Hook CTR no início do título",
    viral_pos_num:"Número no título",
    viral_pos_em:"Palavra emocional presente",
    viral_pos_desc:"Descrição longa o suficiente",
    viral_pos_len:"Comprimento de título ideal",
    viral_neg_hook:"Sem hook CTR — adicionar pergunta ou número no início",
    viral_neg_num:"Sem número — títulos com números obtêm +40% CTR",
    viral_neg_em:"Sem palavra emocional — adicionar palavra forte",
    viral_neg_desc_tpl:"Descrição curta (N car.) — objetivo 500+",
    viral_neg_len_short:"Título muito curto",
    viral_neg_len_long:"Título muito longo",
    viral_potential_title:"Pontuação viral potencial",
    btn_viral_ai:"✨ Análise viral IA",
    emotion_curiosity:"Curiosidade", emotion_surprise:"Surpresa",
    emotion_desire:"Desejo", emotion_urgency:"Urgência", emotion_trust:"Confiança",
    cl_len_why:"O comprimento do título influencia a exibição no YouTube e Google. 55–70 caracteres é ideal.",
    cl_num_why:"Números tornam o título concreto. O olho humano é atraído por números.",
    cl_em_why2:"Palavras emocionais desencadeiam uma resposta que leva a clicar.",
    cl_hk_why2:"As primeiras 3 palavras do título são as mais lidas.",
    cl_desc_why:"YouTube indexa sua descrição. Uma descrição rica ajuda o algoritmo.",
    cl_len_s1:"Adicionar palavras-chave de nicho", cl_len_s2:"Precisar o conteúdo", cl_len_s3:"Incluir benefício",
    cl_len_r1:"Remover palavras não essenciais", cl_len_r2:"Usar abreviações", cl_len_r3:"Reformular em uma frase",
    cl_num_s1:"Tentar: \"5 dicas...\"", cl_num_s2:"Tentar: \"100% grátis...\"", cl_num_s3:"Tentar: \"Em 10 minutos\"",
    cl_em_s1:"\"Incrível\"", cl_em_s2:"\"Grátis\"", cl_em_s3:"\"Segredo\"", cl_em_s4:"\"Definitivo\"",
    cl_hk_s1:"\"Como...\"", cl_hk_s2:"\"Por que...\"", cl_hk_s3:"\"Os X melhores...\"",
    cl_desc_s1:"Adicionar palavras-chave naturais", cl_desc_s2:"Incluir timestamps", cl_desc_s3:"Adicionar CTA",
    cl_punct_s1:"Adicionar uma pergunta", cl_punct_s2:"Adicionar exclamação no final",
    missing_kw_list:"tutorial,grátis,completo,2024,iniciante,guia",
    comp_opp_label:"Nichos inexplorados em seu tema"
  },
  it:{
    nav_coach:"🧠 Coach", coach_potential:"Potenziale del video", coach_actions:"azioni", coach_fix:"Correggi", coach_grow:"Trova idee virali", coach_a_title:"Correggi il tuo titolo", coach_w_title_kw:"Il titolo necessita di ottimizzazione SEO", coach_w_title_long:"Titolo troppo lungo (oltre 70 caratteri)", coach_a_thumb:"Migliora la tua miniatura", coach_w_thumb:"Ampio margine per migliorare la miniatura", coach_a_short:"Pubblica uno Short su questo argomento", coach_w_short:"Aumenta il tuo potenziale virale con uno Short", coach_ok_title:"Titolo OK", coach_ok_thumb:"Miniatura OK", coach_ok_viral:"Potenziale virale OK", coach_all_good:"Il tuo video è già ben ottimizzato!", sec_coach:"Coach", sec_analyser:"Analizza", sec_creer:"Crea", sec_studio:"Studio", sec_croissance:"Crescita",
    nav_overview:"Panoramica", nav_seo:"SEO", nav_thumbnail:"Miniatura",
    nav_viral:"Virale", nav_competitor:"Concorrenti", nav_titles:"Titoli IA", nav_actions:"Azioni",
    score_seo:"Punteggio SEO", score_viral:"Punteggio Virale",
    score_thumb:"Punteggio Miniatura", score_competition:"Concorrenza",
    score_global:"Punteggio Globale",
    views:"visualizzazioni", desc_chars:"car. descrizione", title_chars:"car. titolo",
    checklist_title:"Checklist SEO", criteria_ok:"criteri validati",
    cl_len_label:"Lunghezza titolo", cl_len_ok:n=>`${n} car. — perfetto`,
    cl_len_short:n=>`${n} car. — troppo corto`, cl_len_long:n=>`${n} car. — troppo lungo`,
    cl_len_impact_ok:"Lunghezza ottimale per il SEO di YouTube.",
    cl_len_impact_fix:n=>`Titolo di ${n} car. Impatto SEO: ${n<45?"-15%":"-10%"}. Obiettivo 55–70 car.`,
    cl_num_label:"Numero nel titolo", cl_num_ok:"Numero rilevato — boost CTR",
    cl_num_fix:"Nessun numero. I titoli con numeri hanno +40% CTR.",
    cl_em_label:"Parola emotiva", cl_em_ok:"Parola forte rilevata",
    cl_em_fix:'Aggiungere: "Incredibile", "Gratis", "Segreto"',
    cl_hk_label:"Hook CTR", cl_hk_ok:"Buon hook all'inizio",
    cl_hk_fix:'Iniziare con "Come", "Perché", o un numero',
    cl_desc_label:"Descrizione (300+ car.)", cl_desc_ok:n=>`${n} car. — buona`,
    cl_desc_fix:n=>`${n} car. — obiettivo 500+`,
    seo_title_analysis:"Analisi titolo", seo_desc_analysis:"Analisi descrizione",
    seo_keywords:"Parole chiave rilevate", seo_suggestions:"Suggerimenti IA",
    seo_impact:"Impatto SEO", seo_recommendation:"Raccomandazione",
    thumb_score:"Punteggio Miniatura", thumb_preview:"Anteprima miniatura",
    thumb_emotions:"Analisi emotiva", thumb_strengths:"Punti di forza",
    thumb_weaknesses:"Punti deboli", thumb_suggestions:"Suggerimenti",
    thumb_download:"Scarica HD", thumb_copy_url:"Copia URL",
    thumb_face:"Volto rilevato", thumb_no_face:"Nessun volto",
    thumb_contrast:"Contrasto", thumb_text:"Leggibilità",
    thumb_colors:"Colori", thumb_elements:"Elementi",
    viral_score:"Punteggio Virale", viral_probability:"Probabilità virale",
    viral_low:"Bassa", viral_medium:"Media", viral_high:"Alta",
    viral_factors_pos:"Fattori positivi", viral_factors_neg:"Fattori limitanti",
    viral_prediction:"Previsione IA", viral_tips:"Consigli per massimizzare",
    comp_title:"Analisi Competitiva", comp_position:"La tua posizione",
    comp_keywords:"Parole chiave di nicchia", comp_missing:"Parole chiave mancanti",
    comp_opportunities:"Opportunità", comp_note:"Nota",
    titles_generate:"🚀 Genera 5 titoli ottimizzati",
    titles_seo:"Versione SEO", titles_ctr:"Versione CTR",
    titles_viral:"Versione Virale", titles_shorts:"Versione Shorts",
    titles_trending:"Versione Trending",
    titles_copy:"Copia", titles_score:"Punteggio",
    act_copy_title:"📋 Copia titolo", act_description:"📝 Descrizione IA",
    act_tags:"🏷 Tag IA", act_thumbnail:"🖼 Miniatura HD",
    act_full_report:"✨ Rapporto IA completo",
    act_copy_desc:"📋 Copia descrizione", act_copy_tags:"📋 Copia tutti i tag",
    act_desc_label:"Descrizione IA", act_tags_label:"Tag e Hashtag IA",
    act_tags_yt:"Tag YouTube", act_hashtags:"Hashtag",
    loading:"Analisi IA in corso…", loading_titles:"Generazione titoli…",
    loading_desc:"Generazione descrizione…", loading_tags:"Generazione tag…",
    error_generic:"Errore — verificare proxy", error_no_video:"Nessun video rilevato",
    copied_title:"Titolo copiato ✓", copied_desc:"Descrizione copiata ✓",
    copied_tags:"Tag copiati ✓", lang_changed:"Lingua cambiata",
    plan_free:"Gratuito", plan_pro:"Pro", plan_business:"Business",
    upgrade_msg:"Passa a Pro per sbloccare tutte le funzioni IA",
    upgrade_btn:"Passa a Pro →",

    thumb_good_contrast:"Buon contrasto rilevato",thumb_bad_contrast:"Il contrasto necessita di miglioramento",
    thumb_good_text:"Testo leggibile stimato",thumb_bad_text:"La leggibilità necessita di miglioramento",
    thumb_format:"Formato standard — ottimale",thumb_face_proxy:"Analisi del viso richiede proxy IA",
    thumb_face_ok:"Viso espressivo rilevato",
    thumb_rec1:"Aggiungere viso espressivo (+38% CTR)",thumb_rec2:"Testo grande, max 4–6 parole",
    thumb_rec3:"Colori caldi (rosso/giallo) su sfondo scuro",thumb_rec4:"Freccia o cerchio verso l'elemento principale",
    thumb_current:"Attuale",thumb_potential:"Potenziale",
    thumb_ctr_current:"CTR stimato attuale",thumb_ctr_potential:"CTR potenziale",
    viral_tip1:"Pubblicare tra le 14–17 ora locale",viral_tip2:"Condividere nei primi 30 minuti",
    viral_tip3:"Aggiungere timestamp nella descrizione",viral_tip4:"Rispondere ai primi 10 commenti",
    viral_current:"Punteggio attuale",viral_potential_label:"Punteggio potenziale",viral_possible_with:"punti possibili con:",
    viral_fix_hook:"Miglior hook CTR",viral_fix_emotion:"Parola emotiva forte",
    viral_fix_desc:"Descrizione ottimizzata",viral_fix_number:"Numero nel titolo",
    comp_opp1:"Nicchie non sfruttate nel tuo argomento",comp_opp2:"Angolo originale non coperto dai concorrenti",
    comp_opp3:"Formato lungo sottorappresentato in questo argomento",comp_opp4:"Versione italiana meno competitiva",
    comp_pro_note:"Analisi concorrenti in tempo reale disponibile nella versione Pro.",
    overview_gain_label:"Potenziale se corretto",overview_ctr_label:"CTR stimato",
    seo_gain_potential:"Guadagno SEO potenziale",seo_current:"Punteggio attuale",seo_potential_label:"Punteggio potenziale",
    seo_action:"Azione",seo_gain_col:"Guadagno",seo_score_col:"Punteggio",seo_total:"Totale ottimizzato",
    impact_very_high:"Molto Alto",impact_high:"Alto",impact_medium:"Medio",impact_low:"Basso",
    cl_punct_label:"Punteggiatura CTR (? o !)",cl_punct_ok:"Punteggiatura coinvolgente presente",
    cl_punct_fix:"Nessuna punteggiatura CTR — aggiungere ? o !",
    cl_punct_why:"I titoli con ? o ! ottengono +15% di clic.",cl_punct_gain:"+5 punti SEO",
    report_exec:"Sommario Esecutivo",report_print:"🖨 Stampa",report_close:"✕ Chiudi",
    report_seo_full:"Analisi SEO completa",report_thumb_full:"Analisi miniatura completa",
    report_viral_full:"Analisi virale completa",report_comp_full:"Analisi competitiva completa",
    report_titles:"Titoli alternativi generati",report_opportunities:"Opportunità rilevate",
    report_actions:"Azioni prioritarie",report_charts:"Analisi dei punteggi",
    report_before_after:"Prima / Dopo ottimizzazione",report_loading:"Generazione report premium…",
    report_no_data:"Apri questo report dall'estensione VidSpark AI su un video YouTube.",
    report_keywords:"Parole chiave del titolo",report_missing_kw:"Parole chiave potenzialmente mancanti",
    report_impact_table:"Impatto SEO stimato per correzione",
    report_ctr_current:"CTR stimato attuale",report_ctr_potential:"CTR potenziale",
    report_emotions:"Analisi emotiva",report_visual_criteria:"Criteri visivi",
    report_opp_subject:"Argomento mancante",report_opp_kw:"Parole chiave",
    report_opp_trend:"Tendenza",report_opp_niche:"Nicchia",
    report_viral_impact:"Impatto di ogni correzione",
    report_comp_note_text:"Analisi concorrenti in tempo reale disponibile in Pro via YouTube Data API v3.",
    titles_seo_label:"SEO",titles_ctr_label:"CTR",titles_viral_label:"Virale",
    titles_shorts_label:"Shorts",titles_trending_label:"Trending",format_standard:"Formato 16:9 standard",
    btn_report:"Genera suggerimenti IA",rtl:"false",
    seo_tab_analyse:"📊 Analisi",seo_tab_optim:"🎯 Ottimizzazione",seo_tab_kw:"🔑 Parole chiave",
    seo_tab_rec_kw:"Parole chiave consigliate",seo_tab_issues:"problemi",seo_all_ok:"Tutti i criteri validati!",
    example_label:"Esempio:",recommendation_label:"RACCOMANDAZIONE:",
    impact_pos_num:"Impatto positivo +8% CTR stimato",impact_neg_num:"Aggiungere un numero può aumentare il CTR del 15–40%",
    viral_pos_hook:"Hook CTR all'inizio del titolo",
    viral_pos_num:"Numero nel titolo",
    viral_pos_em:"Parola emotiva presente",
    viral_pos_desc:"Descrizione abbastanza lunga",
    viral_pos_len:"Lunghezza titolo ottimale",
    viral_neg_hook:"Nessun hook CTR — aggiungi domanda o numero all'inizio",
    viral_neg_num:"Nessun numero — titoli con numeri ottengono +40% CTR",
    viral_neg_em:"Nessuna parola emotiva — aggiungi parola forte",
    viral_neg_desc_tpl:"Descrizione breve (N car.) — obiettivo 500+",
    viral_neg_len_short:"Titolo troppo corto",
    viral_neg_len_long:"Titolo troppo lungo",
    viral_potential_title:"Punteggio virale potenziale",
    btn_viral_ai:"✨ Analisi virale IA",
    emotion_curiosity:"Curiosità", emotion_surprise:"Sorpresa",
    emotion_desire:"Desiderio", emotion_urgency:"Urgenza", emotion_trust:"Fiducia",
    cl_len_why:"La lunghezza del titolo influenza la visualizzazione nei risultati YouTube e Google. 55–70 caratteri è ideale.",
    cl_num_why:"I numeri rendono il titolo concreto. L'occhio umano è attratto dai numeri.",
    cl_em_why2:"Le parole emotive scatenano una risposta che spinge a cliccare.",
    cl_hk_why2:"Le prime 3 parole del titolo sono le più lette.",
    cl_desc_why:"YouTube indicizza la tua descrizione. Una descrizione ricca aiuta l'algoritmo.",
    cl_len_s1:"Aggiungere parole chiave di nicchia", cl_len_s2:"Precisare il contenuto", cl_len_s3:"Includere il beneficio",
    cl_len_r1:"Rimuovere parole non essenziali", cl_len_r2:"Usare abbreviazioni", cl_len_r3:"Riformulare in una frase",
    cl_num_s1:"Provare: \"5 consigli...\"", cl_num_s2:"Provare: \"100% gratis...\"", cl_num_s3:"Provare: \"In 10 minuti\"",
    cl_em_s1:"\"Incredibile\"", cl_em_s2:"\"Gratis\"", cl_em_s3:"\"Segreto\"", cl_em_s4:"\"Definitivo\"",
    cl_hk_s1:"\"Come...\"", cl_hk_s2:"\"Perché...\"", cl_hk_s3:"\"I X migliori...\"",
    cl_desc_s1:"Aggiungere parole chiave naturali", cl_desc_s2:"Includere timestamp", cl_desc_s3:"Aggiungere CTA",
    cl_punct_s1:"Aggiungere una domanda", cl_punct_s2:"Aggiungere esclamazione in fondo",
    missing_kw_list:"tutorial,gratis,completo,2024,principiante,guida",
    comp_opp_label:"Nicchie non sfruttate nel tuo argomento"
  }
};
/* ══ TRADUCTIONS COMPLÈTES — 7 langues supplémentaires ══ */

I18N.ru = {
  nav_coach:"🧠 Коуч", coach_potential:"Потенциал видео", coach_actions:"действий", coach_fix:"Исправить", coach_grow:"Найди вирусную идею", coach_a_title:"Исправь заголовок", coach_w_title_kw:"Заголовок нужно оптимизировать под SEO", coach_w_title_long:"Заголовок слишком длинный (более 70 символов)", coach_a_thumb:"Улучши обложку", coach_w_thumb:"Много возможностей улучшить обложку", coach_a_short:"Опубликуй Short на эту тему", coach_w_short:"Повысь вирусный потенциал с помощью Short", coach_ok_title:"Заголовок ОК", coach_ok_thumb:"Обложка ОК", coach_ok_viral:"Вирусный потенциал ОК", coach_all_good:"Твоё видео уже хорошо оптимизировано!", sec_coach:"Коуч", sec_analyser:"Анализ", sec_creer:"Создать", sec_studio:"Студия", sec_croissance:"Рост",
    nav_overview:"Обзор", nav_seo:"SEO", nav_thumbnail:"Превью",
  nav_viral:"Вирусный", nav_competitor:"Конкуренты", nav_titles:"ИИ Заголовки", nav_actions:"Действия",
  score_seo:"SEO Балл", score_viral:"Вирусный Балл", score_thumb:"Балл Превью",
  score_competition:"Конкуренция", score_global:"Общий Балл",
  views:"просмотров", desc_chars:"симв. описание", title_chars:"симв. заголовок",
  checklist_title:"SEO Чеклист", criteria_ok:"критериев выполнено",
  cl_len_label:"Длина заголовка", cl_len_ok:n=>`${n} симв. — отлично`,
  cl_len_short:n=>`${n} симв. — слишком коротко`, cl_len_long:n=>`${n} симв. — слишком длинно`,
  cl_len_impact_ok:"Оптимальная длина для YouTube SEO.",
  cl_len_impact_fix:n=>`Заголовок ${n} симв. Влияние на SEO: ${n<45?"-15%":"-10%"}. Цель 55–70 симв.`,
  cl_num_label:"Цифра в заголовке", cl_num_ok:"Цифра найдена — буст CTR",
  cl_num_fix:"Нет цифры. Заголовки с цифрами получают +40% CTR.",
  cl_em_label:"Эмоциональное слово", cl_em_ok:"Силовое слово найдено",
  cl_em_fix:'Добавить: "Невероятно", "Бесплатно", "Секрет", "Лучший"',
  cl_hk_label:"CTR крючок", cl_hk_ok:"Хороший крючок найден",
  cl_hk_fix:'Начать с "Как", "Почему" или цифры',
  cl_desc_label:"Описание (300+ симв.)", cl_desc_ok:n=>`${n} симв. — хорошо`,
  cl_desc_fix:n=>`${n} симв. — цель 500+`,
  seo_title_analysis:"Анализ заголовка", seo_desc_analysis:"Анализ описания",
  seo_keywords:"Найденные ключевые слова", seo_suggestions:"Предложения ИИ",
  seo_impact:"Влияние на SEO", seo_recommendation:"Рекомендация",
  thumb_score:"Балл Превью", thumb_preview:"Превью миниатюры",
  thumb_emotions:"Эмоциональный анализ", thumb_strengths:"Сильные стороны",
  thumb_weaknesses:"Слабые стороны", thumb_suggestions:"Предложения",
  thumb_download:"Скачать HD", thumb_copy_url:"Копировать URL",
  thumb_face:"Лицо найдено", thumb_no_face:"Нет лица",
  thumb_contrast:"Контраст", thumb_text:"Читаемость текста",
  thumb_colors:"Цвета", thumb_elements:"Элементы",
  thumb_good_contrast:"Хороший контраст", thumb_bad_contrast:"Контраст нужно улучшить",
  thumb_good_text:"Текст читаем", thumb_bad_text:"Читаемость нужно улучшить",
  thumb_format:"Стандартный формат — оптимально", thumb_face_proxy:"Требуется прокси для ИИ",
  thumb_face_ok:"Выразительное лицо найдено",
  thumb_rec1:"Добавить выразительное лицо (+38% CTR)", thumb_rec2:"Крупный текст, макс. 4–6 слов",
  thumb_rec3:"Тёплые цвета на тёмном фоне", thumb_rec4:"Стрелка к главному элементу",
  thumb_current:"Текущий", thumb_potential:"Потенциал",
  thumb_ctr_current:"Текущий CTR", thumb_ctr_potential:"Потенциальный CTR",
  viral_score:"Вирусный Балл", viral_probability:"Вирусная вероятность",
  viral_low:"Низкий", viral_medium:"Средний", viral_high:"Высокий",
  viral_factors_pos:"Положительные факторы", viral_factors_neg:"Ограничивающие факторы",
  viral_prediction:"Прогноз ИИ", viral_tips:"Советы для максимизации",
  viral_tip1:"Публиковать между 14–17 по местному времени",
  viral_tip2:"Поделиться в первые 30 минут",
  viral_tip3:"Добавить временны́е метки в описание",
  viral_tip4:"Ответить на первые 10 комментариев",
  viral_current:"Текущий балл", viral_potential_label:"Потенциальный балл",
  viral_possible_with:"баллов возможно с:",
  viral_fix_hook:"Лучший CTR крючок", viral_fix_emotion:"Сильное эмоциональное слово",
  viral_fix_desc:"Оптимизированное описание", viral_fix_number:"Цифра в заголовке",
  comp_title:"Конкурентный анализ", comp_position:"Ваша позиция",
  comp_keywords:"Ключевые слова ниши", comp_missing:"Отсутствующие ключевые слова",
  comp_opportunities:"Возможности", comp_note:"Примечание",
  comp_opp1:"Неиспользованные ниши в вашей теме",
  comp_opp2:"Оригинальный угол, не освещённый конкурентами",
  comp_opp3:"Длинный формат мало представлен в теме",
  comp_opp4:"Русская версия менее конкурентна",
  comp_pro_note:"Анализ конкурентов в реальном времени доступен в Pro версии.",
  titles_generate:"🚀 Создать 5 заголовков", titles_seo:"SEO версия", titles_ctr:"CTR версия",
  titles_viral:"Вирусная версия", titles_shorts:"Shorts версия", titles_trending:"Трендовая версия",
  titles_copy:"Копировать", titles_score:"Балл",
  act_copy_title:"📋 Копировать заголовок", act_description:"📝 ИИ Описание",
  act_tags:"🏷 ИИ Теги", act_thumbnail:"🖼 HD Превью",
  act_full_report:"✨ Полный ИИ Отчёт",
  act_copy_desc:"📋 Копировать описание", act_copy_tags:"📋 Копировать все теги",
  act_desc_label:"ИИ Описание", act_tags_label:"ИИ Теги и Хэштеги",
  act_tags_yt:"YouTube Теги", act_hashtags:"Хэштеги",
  loading:"ИИ анализ…", loading_titles:"Создание заголовков…",
  loading_desc:"Создание описания…", loading_tags:"Создание тегов…",
  error_generic:"Ошибка — проверьте прокси", error_no_video:"Видео не найдено",
  copied_title:"Заголовок скопирован ✓", copied_desc:"Описание скопировано ✓",
  copied_tags:"Теги скопированы ✓", lang_changed:"Язык изменён",
  plan_free:"Бесплатно", plan_pro:"Pro", plan_business:"Бизнес",
  upgrade_msg:"Перейдите на Pro для всех ИИ функций",
  upgrade_btn:"Перейти на Pro →",
  overview_gain_label:"Потенциал если исправить", overview_ctr_label:"Расчётный CTR",
  seo_gain_potential:"Потенциал SEO", seo_current:"Текущий балл", seo_potential_label:"Потенциальный балл",
  seo_action:"Действие", seo_gain_col:"Прирост", seo_score_col:"Балл", seo_total:"Итого после оптимизации",
  impact_very_high:"Очень Высокий", impact_high:"Высокий", impact_medium:"Средний", impact_low:"Низкий",
  cl_punct_label:"CTR пунктуация (? или !)", cl_punct_ok:"Привлекательная пунктуация есть",
  cl_punct_fix:"Нет CTR пунктуации — добавьте ? или !",
  cl_punct_why:"Заголовки с ? или ! получают +15% кликов.",
  cl_punct_gain:"+5 баллов SEO",
  btn_report:"Создать предложения ИИ", rtl:"false",
  format_standard:"Стандартный формат 16:9",
  report_exec:"Резюме", report_print:"🖨 Печать", report_close:"✕ Закрыть",
  report_seo_full:"Полный SEO анализ", report_viral_full:"Полный вирусный анализ",
  report_thumb_full:"Полный анализ миниатюры", report_comp_full:"Полный конкурентный анализ",
  report_titles:"Альтернативные заголовки", report_opportunities:"Найденные возможности",
  report_actions:"Приоритетные действия", report_charts:"Анализ баллов",
  report_before_after:"До / После оптимизации", report_loading:"Создание отчёта…",
  report_no_data:"Откройте этот отчёт из расширения VidSpark AI на YouTube.",
  report_keywords:"Ключевые слова заголовка", report_missing_kw:"Возможно отсутствующие ключевые слова",
  report_impact_table:"Расчётное влияние на SEO", report_ctr_current:"Расчётный CTR",
  report_ctr_potential:"Потенциальный CTR", report_emotions:"Эмоциональный анализ",
  report_visual_criteria:"Визуальные критерии", report_opp_subject:"Отсутствующая тема",
  report_opp_kw:"Ключевые слова", report_opp_trend:"Тренд", report_opp_niche:"Ниша",
  report_viral_impact:"Влияние каждого исправления",
  report_comp_note_text:"Анализ конкурентов в реальном времени доступен в Pro версии.",
  titles_seo_label:"SEO", titles_ctr_label:"CTR", titles_viral_label:"Вирусный",
  titles_shorts_label:"Shorts", titles_trending_label:"Трендовый",
  viral_pos_hook:"CTR крючок в начале заголовка",
  viral_pos_num:"Цифра в заголовке",
  viral_pos_em:"Эмоциональное слово есть",
  viral_pos_desc:"Описание достаточно длинное",
  viral_pos_len:"Оптимальная длина заголовка",
  viral_neg_hook:"Нет CTR крючка — добавьте вопрос или цифру в начало",
  viral_neg_num:"Нет цифры — заголовки с цифрами получают +40% CTR",
  viral_neg_em:"Нет эмоционального слова — добавьте силовое слово",
  viral_neg_desc_tpl:"Короткое описание (N симв.) — цель 500+",
  viral_neg_len_short:"Заголовок слишком короткий",
  viral_neg_len_long:"Заголовок слишком длинный",
  viral_potential_title:"Вирусный потенциал",
  example_label:"Пример:",recommendation_label:"РЕКОМЕНДАЦИЯ:",
  impact_pos_num:"Положительный эффект +8% CTR",impact_neg_num:"Добавление цифры может увеличить CTR на 15–40%",
  btn_viral_ai:"✨ Вирусный ИИ анализ",
  seo_tab_analyse:"📊 Анализ",seo_tab_optim:"🎯 Оптимизация",seo_tab_kw:"🔑 Ключевые слова",
  seo_tab_rec_kw:"Рекомендуемые ключевые слова",seo_tab_issues:"проблемы",seo_all_ok:"Все критерии подтверждены!",
    emotion_curiosity:"Любопытство", emotion_surprise:"Удивление",
    emotion_desire:"Желание", emotion_urgency:"Срочность", emotion_trust:"Доверие",
    cl_len_why:"Длина заголовка напрямую влияет на отображение в результатах YouTube и Google. Идеально 55–70 символов.",
    cl_num_why:"Цифры делают заголовок конкретным и измеримым. Человеческий глаз притягивается к цифрам.",
    cl_em_why2:"Эмоциональные слова вызывают мгновенную психологическую реакцию, побуждающую кликнуть.",
    cl_hk_why2:"Первые 3 слова заголовка читаются чаще всего. Крючок в виде вопроса создаёт открытую петлю.",
    cl_desc_why:"YouTube индексирует текст вашего описания. Подробное описание помогает алгоритму понять видео.",
    cl_len_s1:"Добавить нишевые ключевые слова", cl_len_s2:"Уточнить содержание", cl_len_s3:"Включить главную пользу",
    cl_len_r1:"Удалить лишние слова", cl_len_r2:"Использовать сокращения", cl_len_r3:"Переформулировать в одну фразу",
    cl_num_s1:"Попробовать: \"5 советов...\"", cl_num_s2:"Попробовать: \"100% бесплатно...\"", cl_num_s3:"Попробовать: \"За 10 минут\"",
    cl_em_s1:"\"Невероятно\"", cl_em_s2:"\"Бесплатно\"", cl_em_s3:"\"Секрет\"", cl_em_s4:"\"Лучший\"",
    cl_hk_s1:"\"Как...\"", cl_hk_s2:"\"Почему...\"", cl_hk_s3:"\"X лучших...\"",
    cl_desc_s1:"Добавить естественные ключевые слова", cl_desc_s2:"Включить временны́е метки", cl_desc_s3:"Добавить ссылки и CTA",
    cl_punct_s1:"Добавить вопрос", cl_punct_s2:"Добавить восклицание в конце",
    missing_kw_list:"урок,бесплатно,полный,2024,начинающий,руководство",
    comp_opp_label:"Неиспользованные ниши в вашей теме"
};

I18N.ja = {
  nav_coach:"🧠 コーチ", coach_potential:"動画のポテンシャル", coach_actions:"アクション", coach_fix:"修正する", coach_grow:"バズるアイデアを探す", coach_a_title:"タイトルを修正", coach_w_title_kw:"タイトルにSEO最適化が必要", coach_w_title_long:"タイトルが長すぎます（70文字以上）", coach_a_thumb:"サムネイルを改善", coach_w_thumb:"サムネイルに大きな改善余地", coach_a_short:"このテーマでShortを投稿", coach_w_short:"Shortでバズる可能性を高める", coach_ok_title:"タイトルOK", coach_ok_thumb:"サムネイルOK", coach_ok_viral:"バズる可能性OK", coach_all_good:"あなたの動画はすでに最適化されています！", sec_coach:"コーチ", sec_analyser:"分析", sec_creer:"作成", sec_studio:"スタジオ", sec_croissance:"成長",
    nav_overview:"概要", nav_seo:"SEO", nav_thumbnail:"サムネイル",
  nav_viral:"バイラル", nav_competitor:"競合他社", nav_titles:"AIタイトル", nav_actions:"アクション",
  score_seo:"SEOスコア", score_viral:"バイラルスコア", score_thumb:"サムネイルスコア",
  score_competition:"競合", score_global:"総合スコア",
  views:"回視聴", desc_chars:"文字(説明)", title_chars:"文字(タイトル)",
  checklist_title:"SEOチェックリスト", criteria_ok:"基準クリア",
  cl_len_label:"タイトル長", cl_len_ok:n=>`${n}文字 — 最適`,
  cl_len_short:n=>`${n}文字 — 短すぎ`, cl_len_long:n=>`${n}文字 — 長すぎ`,
  cl_len_impact_ok:"YouTube SEOに最適な長さです。",
  cl_len_impact_fix:n=>`タイトル${n}文字。SEO影響: ${n<45?"-15%":"-10%"}。55–70文字を目指してください。`,
  cl_num_label:"タイトルに数字", cl_num_ok:"数字あり — CTR向上",
  cl_num_fix:"数字なし。数字入りタイトルは+40% CTR。",
  cl_em_label:"感情的ワード", cl_em_ok:"パワーワードあり",
  cl_em_fix:'"驚き"、"無料"、"秘密"、"最高"を追加',
  cl_hk_label:"CTRフック", cl_hk_ok:"良いフックあり",
  cl_hk_fix:'"方法"、"理由"、または数字で始める',
  cl_desc_label:"説明文(300+文字)", cl_desc_ok:n=>`${n}文字 — 良好`,
  cl_desc_fix:n=>`${n}文字 — 500+を目指して`,
  seo_title_analysis:"タイトル分析", seo_desc_analysis:"説明文分析",
  seo_keywords:"検出されたキーワード", seo_suggestions:"AI提案",
  seo_impact:"SEO影響", seo_recommendation:"推奨事項",
  thumb_score:"サムネイルスコア", thumb_preview:"サムネイルプレビュー",
  thumb_emotions:"感情分析", thumb_strengths:"強み", thumb_weaknesses:"弱み",
  thumb_suggestions:"提案", thumb_download:"HDダウンロード", thumb_copy_url:"URLコピー",
  thumb_face:"顔検出", thumb_no_face:"顔なし", thumb_contrast:"コントラスト",
  thumb_text:"テキスト読みやすさ", thumb_colors:"色", thumb_elements:"要素",
  thumb_good_contrast:"良好なコントラスト", thumb_bad_contrast:"コントラスト改善必要",
  thumb_good_text:"テキスト読みやすい", thumb_bad_text:"読みやすさ改善必要",
  thumb_format:"標準フォーマット — 最適", thumb_face_proxy:"顔検出にはプロキシが必要",
  thumb_face_ok:"表情豊かな顔を検出",
  thumb_rec1:"表情豊かな顔を追加 (+38% CTR)", thumb_rec2:"大きなテキスト、最大4–6語",
  thumb_rec3:"明るい色（赤/黄）を暗い背景に", thumb_rec4:"矢印または円でメイン要素を指す",
  thumb_current:"現在", thumb_potential:"ポテンシャル",
  thumb_ctr_current:"現在のCTR推定", thumb_ctr_potential:"潜在CTR",
  viral_score:"バイラルスコア", viral_probability:"バイラル確率",
  viral_low:"低い", viral_medium:"中程度", viral_high:"高い",
  viral_factors_pos:"ポジティブ要因", viral_factors_neg:"制限要因",
  viral_prediction:"AI予測", viral_tips:"最大化のヒント",
  viral_tip1:"現地時間14時〜17時に投稿", viral_tip2:"最初の30分以内にシェア",
  viral_tip3:"説明にタイムスタンプを追加", viral_tip4:"最初の10件のコメントに返信",
  viral_current:"現在のスコア", viral_potential_label:"潜在スコア",
  viral_possible_with:"ポイント可能（修正後）:",
  viral_fix_hook:"より良いCTRフック", viral_fix_emotion:"強い感情的ワード",
  viral_fix_desc:"最適化された説明", viral_fix_number:"タイトルに数字",
  comp_title:"競合分析", comp_position:"あなたの位置",
  comp_keywords:"ニッチキーワード", comp_missing:"不足キーワード",
  comp_opportunities:"機会", comp_note:"注意",
  comp_opp1:"あなたのトピックで未開拓のニッチ",
  comp_opp2:"競合他社がカバーしていない独自の角度",
  comp_opp3:"このトピックで長尺フォーマットが少ない",
  comp_opp4:"日本語版は競合が少ない",
  comp_pro_note:"リアルタイム競合分析はProバージョンで利用可能。",
  titles_generate:"🚀 最適化タイトル5つ生成", titles_seo:"SEOバージョン",
  titles_ctr:"CTRバージョン", titles_viral:"バイラルバージョン",
  titles_shorts:"Shortsバージョン", titles_trending:"トレンドバージョン",
  titles_copy:"コピー", titles_score:"スコア",
  act_copy_title:"📋 タイトルをコピー", act_description:"📝 AI説明文",
  act_tags:"🏷 AIタグ", act_thumbnail:"🖼 HDサムネイル",
  act_full_report:"✨ 完全AIレポート",
  act_copy_desc:"📋 説明文をコピー", act_copy_tags:"📋 全タグをコピー",
  act_desc_label:"AI説明文", act_tags_label:"AIタグとハッシュタグ",
  act_tags_yt:"YouTubeタグ", act_hashtags:"ハッシュタグ",
  loading:"AI分析中…", loading_titles:"タイトル生成中…",
  loading_desc:"説明文生成中…", loading_tags:"タグ生成中…",
  error_generic:"エラー — プロキシを確認", error_no_video:"動画が検出されません",
  copied_title:"タイトルをコピーしました ✓", copied_desc:"説明文をコピーしました ✓",
  copied_tags:"タグをコピーしました ✓", lang_changed:"言語変更",
  plan_free:"無料", plan_pro:"Pro", plan_business:"ビジネス",
  upgrade_msg:"Proにアップグレードして全AI機能を解放",
  upgrade_btn:"Proにアップグレード →",
  overview_gain_label:"修正後のポテンシャル", overview_ctr_label:"推定CTR",
  seo_gain_potential:"SEOポテンシャル向上", seo_current:"現在のスコア", seo_potential_label:"潜在スコア",
  seo_action:"アクション", seo_gain_col:"向上", seo_score_col:"スコア", seo_total:"最適化後合計",
  impact_very_high:"非常に高い", impact_high:"高い", impact_medium:"中程度", impact_low:"低い",
  cl_punct_label:"CTR句読点 (? または !)", cl_punct_ok:"魅力的な句読点あり",
  cl_punct_fix:"CTR句読点なし — ? または ! を追加",
  cl_punct_why:"? または ! 入りタイトルは+15%のクリック率。",
  cl_punct_gain:"+5 SEOポイント",
  btn_report:"AI提案を生成", rtl:"false",
  format_standard:"標準16:9フォーマット",
  report_exec:"エグゼクティブサマリー", report_print:"🖨 印刷", report_close:"✕ 閉じる",
  report_seo_full:"完全SEO分析", report_viral_full:"完全バイラル分析",
  report_thumb_full:"完全サムネイル分析", report_comp_full:"完全競合分析",
  report_titles:"生成された代替タイトル", report_opportunities:"検出された機会",
  report_actions:"優先アクション", report_charts:"スコア分析",
  report_before_after:"最適化前 / 後", report_loading:"プレミアムレポート生成中…",
  report_no_data:"YouTube動画でVidSpark AI拡張機能からこのレポートを開いてください。",
  report_keywords:"タイトルキーワード", report_missing_kw:"不足している可能性のあるキーワード",
  report_impact_table:"修正ごとの推定SEO影響",
  report_ctr_current:"推定現在CTR", report_ctr_potential:"潜在CTR",
  report_emotions:"感情分析", report_visual_criteria:"視覚的基準",
  report_opp_subject:"不足トピック", report_opp_kw:"キーワード",
  report_opp_trend:"トレンド", report_opp_niche:"ニッチ",
  report_viral_impact:"各修正の影響",
  report_comp_note_text:"リアルタイム競合分析はProでYouTube Data API v3経由で利用可能。",
  titles_seo_label:"SEO", titles_ctr_label:"CTR", titles_viral_label:"バイラル",
  titles_shorts_label:"Shorts", titles_trending_label:"トレンド",
  viral_pos_hook:"タイトル冒頭にCTRフック",
  viral_pos_num:"タイトルに数字",
  viral_pos_em:"感情的ワードあり",
  viral_pos_desc:"説明文が十分な長さ",
  viral_pos_len:"タイトル長が最適",
  viral_neg_hook:"CTRフックなし — 質問か数字を冒頭に",
  viral_neg_num:"数字なし — 数字入りタイトルは+40% CTR",
  viral_neg_em:"感情的ワードなし — パワーワードを追加",
  viral_neg_desc_tpl:"短い説明文 (N文字) — 500+を目指して",
  viral_neg_len_short:"タイトルが短すぎ",
  viral_neg_len_long:"タイトルが長すぎ",
  viral_potential_title:"バイラルポテンシャル",
  example_label:"例：",recommendation_label:"推奨：",
  impact_pos_num:"ポジティブな影響 +8% CTR",impact_neg_num:"数字を追加するとCTRが15–40%向上",
  btn_viral_ai:"✨ バイラルAI分析",
  seo_tab_analyse:"📊 分析",seo_tab_optim:"🎯 最適化",seo_tab_kw:"🔑 キーワード",
  seo_tab_rec_kw:"推奨キーワード",seo_tab_issues:"問題",seo_all_ok:"すべての基準が検証されました!",
    emotion_curiosity:"好奇心", emotion_surprise:"驚き",
    emotion_desire:"欲求", emotion_urgency:"緊急性", emotion_trust:"信頼",
    cl_len_why:"タイトルの長さはYouTubeとGoogle検索結果の表示に直接影響します。55〜70文字が理想的です。",
    cl_num_why:"数字はタイトルを具体的で測定可能にします。人間の目はテキストの中の数字に自然に引き付けられます。",
    cl_em_why2:"感情的な言葉はクリックを促す即座の心理的反応を引き起こします。",
    cl_hk_why2:"タイトルの最初の3語が最もよく読まれます。質問形式のフックは開いた心理的ループを作ります。",
    cl_desc_why:"YouTubeは説明文のテキストをインデックスします。充実した説明はアルゴリズムが動画を理解し推薦するのに役立ちます。",
    cl_len_s1:"ニッチなキーワードを追加", cl_len_s2:"コンテンツを明確化", cl_len_s3:"主なメリットを含める",
    cl_len_r1:"不要な言葉を削除", cl_len_r2:"略語を使用", cl_len_r3:"一文に言い換える",
    cl_num_s1:"\"5つのコツ...\"を試す", cl_num_s2:"\"100%無料...\"を試す", cl_num_s3:"\"10分で...\"を試す",
    cl_em_s1:"\"驚き\"", cl_em_s2:"\"無料\"", cl_em_s3:"\"秘密\"", cl_em_s4:"\"究極\"",
    cl_hk_s1:"\"方法...\"", cl_hk_s2:"\"理由...\"", cl_hk_s3:"\"X選...\"",
    cl_desc_s1:"自然なキーワードを追加", cl_desc_s2:"タイムスタンプを含める", cl_desc_s3:"リンクとCTAを追加",
    cl_punct_s1:"質問を追加", cl_punct_s2:"最後に感嘆符を追加",
    missing_kw_list:"チュートリアル,無料,完全,2024,初心者,ガイド",
    comp_opp_label:"あなたのトピックで未開拓のニッチ"
};

I18N.ko = {
  nav_coach:"🧠 코치", coach_potential:"영상 잠재력", coach_actions:"개의 작업", coach_fix:"수정하기", coach_grow:"바이럴 아이디어 찾기", coach_a_title:"제목 수정하기", coach_w_title_kw:"제목에 SEO 최적화가 필요해요", coach_w_title_long:"제목이 너무 깁니다 (70자 초과)", coach_a_thumb:"썸네일 개선하기", coach_w_thumb:"썸네일 개선 여지가 큽니다", coach_a_short:"이 주제로 Short 올리기", coach_w_short:"Short로 바이럴 잠재력 높이기", coach_ok_title:"제목 OK", coach_ok_thumb:"썸네일 OK", coach_ok_viral:"바이럴 잠재력 OK", coach_all_good:"영상이 이미 잘 최적화되어 있어요!", sec_coach:"코치", sec_analyser:"분석", sec_creer:"제작", sec_studio:"스튜디오", sec_croissance:"성장",
    nav_overview:"개요", nav_seo:"SEO", nav_thumbnail:"썸네일",
  nav_viral:"바이럴", nav_competitor:"경쟁자", nav_titles:"AI 제목", nav_actions:"작업",
  score_seo:"SEO 점수", score_viral:"바이럴 점수", score_thumb:"썸네일 점수",
  score_competition:"경쟁", score_global:"종합 점수",
  views:"조회수", desc_chars:"자 설명", title_chars:"자 제목",
  checklist_title:"SEO 체크리스트", criteria_ok:"기준 통과",
  cl_len_label:"제목 길이", cl_len_ok:n=>`${n}자 — 완벽`,
  cl_len_short:n=>`${n}자 — 너무 짧음`, cl_len_long:n=>`${n}자 — 너무 김`,
  cl_len_impact_ok:"YouTube SEO에 최적인 길이입니다.",
  cl_len_impact_fix:n=>`제목 ${n}자. SEO 영향: ${n<45?"-15%":"-10%"}. 55–70자를 목표로 하세요.`,
  cl_num_label:"제목의 숫자", cl_num_ok:"숫자 감지됨 — CTR 향상",
  cl_num_fix:"숫자 없음. 숫자 있는 제목은 +40% CTR.",
  cl_em_label:"감성 단어", cl_em_ok:"파워 워드 감지됨",
  cl_em_fix:'"놀라운", "무료", "비밀", "최고" 추가',
  cl_hk_label:"CTR 훅", cl_hk_ok:"좋은 훅 감지됨",
  cl_hk_fix:'"방법", "이유" 또는 숫자로 시작',
  cl_desc_label:"설명 (300+자)", cl_desc_ok:n=>`${n}자 — 좋음`,
  cl_desc_fix:n=>`${n}자 — 500+자 목표`,
  seo_title_analysis:"제목 분석", seo_desc_analysis:"설명 분석",
  seo_keywords:"감지된 키워드", seo_suggestions:"AI 제안",
  seo_impact:"SEO 영향", seo_recommendation:"권장 사항",
  thumb_score:"썸네일 점수", thumb_preview:"썸네일 미리보기",
  thumb_emotions:"감정 분석", thumb_strengths:"강점", thumb_weaknesses:"약점",
  thumb_suggestions:"제안", thumb_download:"HD 다운로드", thumb_copy_url:"URL 복사",
  thumb_face:"얼굴 감지됨", thumb_no_face:"얼굴 없음", thumb_contrast:"대비",
  thumb_text:"텍스트 가독성", thumb_colors:"색상", thumb_elements:"요소",
  thumb_good_contrast:"좋은 대비 감지됨", thumb_bad_contrast:"대비 개선 필요",
  thumb_good_text:"텍스트 읽기 쉬움", thumb_bad_text:"가독성 개선 필요",
  thumb_format:"표준 형식 — 최적", thumb_face_proxy:"얼굴 감지에 프록시 필요",
  thumb_face_ok:"표정 있는 얼굴 감지됨",
  thumb_rec1:"표정 있는 얼굴 추가 (+38% CTR)", thumb_rec2:"큰 텍스트, 최대 4–6단어",
  thumb_rec3:"어두운 배경에 따뜻한 색상", thumb_rec4:"주요 요소를 향한 화살표",
  thumb_current:"현재", thumb_potential:"잠재력",
  thumb_ctr_current:"현재 CTR 추정", thumb_ctr_potential:"잠재 CTR",
  viral_score:"바이럴 점수", viral_probability:"바이럴 확률",
  viral_low:"낮음", viral_medium:"보통", viral_high:"높음",
  viral_factors_pos:"긍정적 요인", viral_factors_neg:"제한 요인",
  viral_prediction:"AI 예측", viral_tips:"최대화 팁",
  viral_tip1:"현지 시간 14시~17시 사이 게시", viral_tip2:"처음 30분 내에 공유",
  viral_tip3:"설명에 타임스탬프 추가", viral_tip4:"처음 10개 댓글에 답변",
  viral_current:"현재 점수", viral_potential_label:"잠재 점수",
  viral_possible_with:"수정 시 점수 가능:",
  viral_fix_hook:"더 나은 CTR 훅", viral_fix_emotion:"강한 감성 단어",
  viral_fix_desc:"최적화된 설명", viral_fix_number:"제목에 숫자",
  comp_title:"경쟁 분석", comp_position:"귀하의 위치",
  comp_keywords:"틈새 키워드", comp_missing:"누락된 키워드",
  comp_opportunities:"기회", comp_note:"참고",
  comp_opp1:"주제에서 미개척 틈새",
  comp_opp2:"경쟁자가 다루지 않은 독창적 각도",
  comp_opp3:"이 주제에서 장편 형식이 적음",
  comp_opp4:"한국어 버전이 덜 경쟁적",
  comp_pro_note:"실시간 경쟁자 분석은 Pro 버전에서 이용 가능.",
  titles_generate:"🚀 5개 최적화 제목 생성", titles_seo:"SEO 버전",
  titles_ctr:"CTR 버전", titles_viral:"바이럴 버전",
  titles_shorts:"Shorts 버전", titles_trending:"트렌딩 버전",
  titles_copy:"복사", titles_score:"점수",
  act_copy_title:"📋 제목 복사", act_description:"📝 AI 설명",
  act_tags:"🏷 AI 태그", act_thumbnail:"🖼 HD 썸네일",
  act_full_report:"✨ 전체 AI 보고서",
  act_copy_desc:"📋 설명 복사", act_copy_tags:"📋 모든 태그 복사",
  act_desc_label:"AI 설명", act_tags_label:"AI 태그 및 해시태그",
  act_tags_yt:"YouTube 태그", act_hashtags:"해시태그",
  loading:"AI 분석 중…", loading_titles:"제목 생성 중…",
  loading_desc:"설명 생성 중…", loading_tags:"태그 생성 중…",
  error_generic:"오류 — 프록시 확인", error_no_video:"동영상 감지 안 됨",
  copied_title:"제목 복사됨 ✓", copied_desc:"설명 복사됨 ✓",
  copied_tags:"태그 복사됨 ✓", lang_changed:"언어 변경됨",
  plan_free:"무료", plan_pro:"Pro", plan_business:"비즈니스",
  upgrade_msg:"모든 AI 기능을 위해 Pro로 업그레이드",
  upgrade_btn:"Pro로 업그레이드 →",
  overview_gain_label:"수정 시 잠재력", overview_ctr_label:"추정 CTR",
  seo_gain_potential:"SEO 잠재 향상", seo_current:"현재 점수", seo_potential_label:"잠재 점수",
  seo_action:"작업", seo_gain_col:"향상", seo_score_col:"점수", seo_total:"최적화 후 합계",
  impact_very_high:"매우 높음", impact_high:"높음", impact_medium:"보통", impact_low:"낮음",
  cl_punct_label:"CTR 구두점 (? 또는 !)", cl_punct_ok:"매력적인 구두점 있음",
  cl_punct_fix:"CTR 구두점 없음 — ? 또는 ! 추가",
  cl_punct_why:"? 또는 ! 있는 제목은 +15% 클릭률.",
  cl_punct_gain:"+5 SEO 점수",
  btn_report:"AI 제안 생성", rtl:"false",
  format_standard:"표준 16:9 형식",
  report_exec:"요약", report_print:"🖨 인쇄", report_close:"✕ 닫기",
  report_seo_full:"전체 SEO 분석", report_viral_full:"전체 바이럴 분석",
  report_thumb_full:"전체 썸네일 분석", report_comp_full:"전체 경쟁 분석",
  report_titles:"생성된 대체 제목", report_opportunities:"감지된 기회",
  report_actions:"우선 조치", report_charts:"점수 분석",
  report_before_after:"최적화 전 / 후", report_loading:"프리미엄 보고서 생성 중…",
  report_no_data:"YouTube 동영상에서 VidSpark AI 확장에서 이 보고서를 여세요.",
  report_keywords:"제목 키워드", report_missing_kw:"잠재적으로 누락된 키워드",
  report_impact_table:"수정별 예상 SEO 영향",
  report_ctr_current:"추정 현재 CTR", report_ctr_potential:"잠재 CTR",
  report_emotions:"감정 분석", report_visual_criteria:"시각적 기준",
  report_opp_subject:"누락된 주제", report_opp_kw:"키워드",
  report_opp_trend:"트렌드", report_opp_niche:"틈새",
  report_viral_impact:"각 수정의 영향",
  report_comp_note_text:"실시간 경쟁자 분석은 Pro에서 YouTube Data API v3를 통해 이용 가능.",
  titles_seo_label:"SEO", titles_ctr_label:"CTR", titles_viral_label:"바이럴",
  titles_shorts_label:"Shorts", titles_trending_label:"트렌딩",
  viral_pos_hook:"제목 시작에 CTR 훅",
  viral_pos_num:"제목에 숫자",
  viral_pos_em:"감성 단어 있음",
  viral_pos_desc:"설명이 충분히 길음",
  viral_pos_len:"제목 길이 최적",
  viral_neg_hook:"CTR 훅 없음 — 질문이나 숫자를 시작에 추가",
  viral_neg_num:"숫자 없음 — 숫자 있는 제목은 +40% CTR",
  viral_neg_em:"감성 단어 없음 — 파워 워드 추가",
  viral_neg_desc_tpl:"짧은 설명 (N자) — 500+자 목표",
  viral_neg_len_short:"제목 너무 짧음",
  viral_neg_len_long:"제목 너무 김",
  viral_potential_title:"바이럴 잠재력",
  example_label:"예시:",recommendation_label:"권장사항:",
  impact_pos_num:"긍정적 영향 +8% CTR",impact_neg_num:"숫자 추가로 CTR 15–40% 향상",
  btn_viral_ai:"✨ 바이럴 AI 분석",
  seo_tab_analyse:"📊 분석",seo_tab_optim:"🎯 최적화",seo_tab_kw:"🔑 키워드",
  seo_tab_rec_kw:"추천 키워드",seo_tab_issues:"문제",seo_all_ok:"모든 기준이 검증되었습니다!",
    emotion_curiosity:"호기심", emotion_surprise:"놀라움",
    emotion_desire:"욕구", emotion_urgency:"긴급성", emotion_trust:"신뢰",
    cl_len_why:"제목 길이는 YouTube 및 Google 결과 표시에 직접 영향을 미칩니다. 55–70자가 이상적입니다.",
    cl_num_why:"숫자는 제목을 구체적이고 측정 가능하게 만듭니다. 인간의 눈은 텍스트 흐름에서 숫자에 자연스럽게 끌립니다.",
    cl_em_why2:"감성적 단어는 클릭을 유도하는 즉각적인 심리적 반응을 일으킵니다.",
    cl_hk_why2:"제목의 첫 3단어가 가장 많이 읽힙니다. 질문 형식의 훅은 열린 심리적 루프를 만듭니다.",
    cl_desc_why:"YouTube는 설명 텍스트를 인덱싱합니다. 풍부한 설명은 알고리즘이 동영상을 이해하고 추천하는 데 도움이 됩니다.",
    cl_len_s1:"틈새 키워드 추가", cl_len_s2:"내용 명확화", cl_len_s3:"주요 혜택 포함",
    cl_len_r1:"불필요한 단어 제거", cl_len_r2:"약어 사용", cl_len_r3:"한 문장으로 재구성",
    cl_num_s1:"\"5가지 팁...\" 시도", cl_num_s2:"\"100% 무료...\" 시도", cl_num_s3:"\"10분 안에...\" 시도",
    cl_em_s1:"\"놀라운\"", cl_em_s2:"\"무료\"", cl_em_s3:"\"비밀\"", cl_em_s4:"\"최고\"",
    cl_hk_s1:"\"방법...\"", cl_hk_s2:"\"이유...\"", cl_hk_s3:"\"X가지 최고...\"",
    cl_desc_s1:"자연스러운 키워드 추가", cl_desc_s2:"타임스탬프 포함", cl_desc_s3:"링크 및 CTA 추가",
    cl_punct_s1:"질문 추가", cl_punct_s2:"끝에 느낌표 추가",
    missing_kw_list:"튜토리얼,무료,완전,2024,초보자,가이드",
    comp_opp_label:"주제에서 미개척 틈새"
};

I18N.hi = {
  nav_coach:"🧠 कोच", coach_potential:"वीडियो की क्षमता", coach_actions:"क्रियाएँ", coach_fix:"ठीक करें", coach_grow:"वायरल आइडिया खोजें", coach_a_title:"अपना टाइटल ठीक करें", coach_w_title_kw:"टाइटल में SEO ऑप्टिमाइज़ेशन ज़रूरी है", coach_w_title_long:"टाइटल बहुत लंबा है (70 अक्षरों से अधिक)", coach_a_thumb:"अपना थंबनेल सुधारें", coach_w_thumb:"थंबनेल सुधारने की काफी गुंजाइश है", coach_a_short:"इस विषय पर एक Short पोस्ट करें", coach_w_short:"Short से अपनी वायरल क्षमता बढ़ाएँ", coach_ok_title:"टाइटल ठीक है", coach_ok_thumb:"थंबनेल ठीक है", coach_ok_viral:"वायरल क्षमता ठीक है", coach_all_good:"आपका वीडियो पहले से ही अच्छी तरह ऑप्टिमाइज़ है!", sec_coach:"कोच", sec_analyser:"विश्लेषण", sec_creer:"बनाएँ", sec_studio:"स्टूडियो", sec_croissance:"विकास",
    nav_overview:"अवलोकन", nav_seo:"SEO", nav_thumbnail:"थंबनेल",
  nav_viral:"वायरल", nav_competitor:"प्रतिस्पर्धी", nav_titles:"AI शीर्षक", nav_actions:"क्रियाएं",
  score_seo:"SEO स्कोर", score_viral:"वायरल स्कोर", score_thumb:"थंबनेल स्कोर",
  score_competition:"प्रतिस्पर्धा", score_global:"कुल स्कोर",
  views:"व्यूज", desc_chars:"अक्षर विवरण", title_chars:"अक्षर शीर्षक",
  checklist_title:"SEO चेकलिस्ट", criteria_ok:"मानदंड पूरे",
  cl_len_label:"शीर्षक लंबाई", cl_len_ok:n=>`${n} अक्षर — सही`,
  cl_len_short:n=>`${n} अक्षर — बहुत छोटा`, cl_len_long:n=>`${n} अक्षर — बहुत लंबा`,
  cl_len_impact_ok:"YouTube SEO के लिए सही लंबाई।",
  cl_len_impact_fix:n=>`शीर्षक ${n} अक्षर। SEO प्रभाव: ${n<45?"-15%":"-10%"}। 55–70 अक्षर का लक्ष्य रखें।`,
  cl_num_label:"शीर्षक में अंक", cl_num_ok:"अंक मिला — CTR बूस्ट",
  cl_num_fix:"अंक नहीं। अंक वाले शीर्षक +40% CTR पाते हैं।",
  cl_em_label:"भावनात्मक शब्द", cl_em_ok:"पावर वर्ड मिला",
  cl_em_fix:'"अद्भुत", "मुफ्त", "रहस्य", "सर्वश्रेष्ठ" जोड़ें',
  cl_hk_label:"CTR हुक", cl_hk_ok:"अच्छा हुक मिला",
  cl_hk_fix:'"कैसे", "क्यों" या अंक से शुरू करें',
  cl_desc_label:"विवरण (300+ अक्षर)", cl_desc_ok:n=>`${n} अक्षर — अच्छा`,
  cl_desc_fix:n=>`${n} अक्षर — 500+ का लक्ष्य`,
  seo_title_analysis:"शीर्षक विश्लेषण", seo_desc_analysis:"विवरण विश्लेषण",
  seo_keywords:"मिले कीवर्ड", seo_suggestions:"AI सुझाव",
  seo_impact:"SEO प्रभाव", seo_recommendation:"सिफारिश",
  thumb_score:"थंबनेल स्कोर", thumb_preview:"थंबनेल पूर्वावलोकन",
  thumb_emotions:"भावनात्मक विश्लेषण", thumb_strengths:"ताकत", thumb_weaknesses:"कमजोरी",
  thumb_suggestions:"सुझाव", thumb_download:"HD डाउनलोड", thumb_copy_url:"URL कॉपी",
  thumb_face:"चेहरा मिला", thumb_no_face:"चेहरा नहीं", thumb_contrast:"कंट्रास्ट",
  thumb_text:"टेक्स्ट पठनीयता", thumb_colors:"रंग", thumb_elements:"तत्व",
  thumb_good_contrast:"अच्छा कंट्रास्ट", thumb_bad_contrast:"कंट्रास्ट सुधारें",
  thumb_good_text:"टेक्स्ट पठनीय", thumb_bad_text:"पठनीयता सुधारें",
  thumb_format:"मानक प्रारूप — सही", thumb_face_proxy:"चेहरे के लिए प्रॉक्सी चाहिए",
  thumb_face_ok:"भावपूर्ण चेहरा मिला",
  thumb_rec1:"भावपूर्ण चेहरा जोड़ें (+38% CTR)", thumb_rec2:"बड़ा टेक्स्ट, अधिकतम 4–6 शब्द",
  thumb_rec3:"गहरे बैकग्राउंड पर गर्म रंग", thumb_rec4:"मुख्य तत्व की ओर तीर",
  thumb_current:"वर्तमान", thumb_potential:"संभावना",
  thumb_ctr_current:"अनुमानित वर्तमान CTR", thumb_ctr_potential:"संभावित CTR",
  viral_score:"वायरल स्कोर", viral_probability:"वायरल संभावना",
  viral_low:"कम", viral_medium:"मध्यम", viral_high:"अधिक",
  viral_factors_pos:"सकारात्मक कारक", viral_factors_neg:"सीमित कारक",
  viral_prediction:"AI भविष्यवाणी", viral_tips:"अधिकतम करने के सुझाव",
  viral_tip1:"स्थानीय समय 14–17 बजे पोस्ट करें", viral_tip2:"पहले 30 मिनट में शेयर करें",
  viral_tip3:"विवरण में टाइमस्टैम्प जोड़ें", viral_tip4:"पहले 10 टिप्पणियों का जवाब दें",
  viral_current:"वर्तमान स्कोर", viral_potential_label:"संभावित स्कोर",
  viral_possible_with:"सुधार के साथ अंक संभव:",
  viral_fix_hook:"बेहतर CTR हुक", viral_fix_emotion:"मजबूत भावनात्मक शब्द",
  viral_fix_desc:"अनुकूलित विवरण", viral_fix_number:"शीर्षक में अंक",
  comp_title:"प्रतिस्पर्धा विश्लेषण", comp_position:"आपकी स्थिति",
  comp_keywords:"नीच कीवर्ड", comp_missing:"गुम कीवर्ड",
  comp_opportunities:"अवसर", comp_note:"नोट",
  comp_opp1:"आपके विषय में अनछुए अवसर",
  comp_opp2:"प्रतिस्पर्धियों द्वारा न कवर किया गया कोण",
  comp_opp3:"इस विषय में लंबा प्रारूप कम है",
  comp_opp4:"हिंदी संस्करण कम प्रतिस्पर्धी",
  comp_pro_note:"वास्तविक समय प्रतिस्पर्धा विश्लेषण Pro संस्करण में उपलब्ध।",
  titles_generate:"🚀 5 शीर्षक बनाएं", titles_seo:"SEO संस्करण",
  titles_ctr:"CTR संस्करण", titles_viral:"वायरल संस्करण",
  titles_shorts:"Shorts संस्करण", titles_trending:"ट्रेंडिंग संस्करण",
  titles_copy:"कॉपी", titles_score:"स्कोर",
  act_copy_title:"📋 शीर्षक कॉपी", act_description:"📝 AI विवरण",
  act_tags:"🏷 AI टैग", act_thumbnail:"🖼 HD थंबनेल",
  act_full_report:"✨ पूर्ण AI रिपोर्ट",
  act_copy_desc:"📋 विवरण कॉपी", act_copy_tags:"📋 सभी टैग कॉपी",
  act_desc_label:"AI विवरण", act_tags_label:"AI टैग और हैशटैग",
  act_tags_yt:"YouTube टैग", act_hashtags:"हैशटैग",
  loading:"AI विश्लेषण…", loading_titles:"शीर्षक बना रहे हैं…",
  loading_desc:"विवरण बना रहे हैं…", loading_tags:"टैग बना रहे हैं…",
  error_generic:"त्रुटि — प्रॉक्सी जांचें", error_no_video:"कोई वीडियो नहीं मिला",
  copied_title:"शीर्षक कॉपी हुआ ✓", copied_desc:"विवरण कॉपी हुआ ✓",
  copied_tags:"टैग कॉपी हुए ✓", lang_changed:"भाषा बदली",
  plan_free:"मुफ्त", plan_pro:"Pro", plan_business:"व्यवसाय",
  upgrade_msg:"सभी AI सुविधाओं के लिए Pro में अपग्रेड करें",
  upgrade_btn:"Pro में अपग्रेड →",
  overview_gain_label:"सुधार पर संभावना", overview_ctr_label:"अनुमानित CTR",
  seo_gain_potential:"SEO संभावित सुधार", seo_current:"वर्तमान स्कोर", seo_potential_label:"संभावित स्कोर",
  seo_action:"क्रिया", seo_gain_col:"सुधार", seo_score_col:"स्कोर", seo_total:"अनुकूलन के बाद कुल",
  impact_very_high:"बहुत अधिक", impact_high:"अधिक", impact_medium:"मध्यम", impact_low:"कम",
  cl_punct_label:"CTR विराम चिह्न (? या !)", cl_punct_ok:"आकर्षक विराम चिह्न है",
  cl_punct_fix:"CTR विराम चिह्न नहीं — ? या ! जोड़ें",
  cl_punct_why:"? या ! वाले शीर्षकों को +15% क्लिक मिलते हैं।",
  cl_punct_gain:"+5 SEO अंक",
  btn_report:"AI सुझाव बनाएं", rtl:"false",
  format_standard:"मानक 16:9 प्रारूप",
  report_exec:"कार्यकारी सारांश", report_print:"🖨 प्रिंट", report_close:"✕ बंद करें",
  report_seo_full:"पूर्ण SEO विश्लेषण", report_viral_full:"पूर्ण वायरल विश्लेषण",
  report_thumb_full:"पूर्ण थंबनेल विश्लेषण", report_comp_full:"पूर्ण प्रतिस्पर्धा विश्लेषण",
  report_titles:"वैकल्पिक शीर्षक बनाए", report_opportunities:"मिले अवसर",
  report_actions:"प्राथमिकता क्रियाएं", report_charts:"स्कोर विश्लेषण",
  report_before_after:"अनुकूलन से पहले / बाद", report_loading:"प्रीमियम रिपोर्ट बना रहे हैं…",
  report_no_data:"YouTube वीडियो पर VidSpark AI एक्सटेंशन से यह रिपोर्ट खोलें।",
  report_keywords:"शीर्षक कीवर्ड", report_missing_kw:"संभावित अनुपस्थित कीवर्ड",
  report_impact_table:"प्रत्येक सुधार का SEO प्रभाव",
  report_ctr_current:"अनुमानित वर्तमान CTR", report_ctr_potential:"संभावित CTR",
  report_emotions:"भावनात्मक विश्लेषण", report_visual_criteria:"दृश्य मानदंड",
  report_opp_subject:"अनुपस्थित विषय", report_opp_kw:"कीवर्ड",
  report_opp_trend:"ट्रेंड", report_opp_niche:"नीच",
  report_viral_impact:"प्रत्येक सुधार का प्रभाव",
  report_comp_note_text:"YouTube Data API v3 के माध्यम से Pro में वास्तविक समय प्रतिस्पर्धा विश्लेषण उपलब्ध।",
  titles_seo_label:"SEO", titles_ctr_label:"CTR", titles_viral_label:"वायरल",
  titles_shorts_label:"Shorts", titles_trending_label:"ट्रेंडिंग",
  viral_pos_hook:"शीर्षक की शुरुआत में CTR हुक",
  viral_pos_num:"शीर्षक में अंक",
  viral_pos_em:"भावनात्मक शब्द मौजूद",
  viral_pos_desc:"विवरण पर्याप्त लंबा",
  viral_pos_len:"शीर्षक की लंबाई सही",
  viral_neg_hook:"CTR हुक नहीं — शुरुआत में प्रश्न या अंक जोड़ें",
  viral_neg_num:"अंक नहीं — अंक वाले शीर्षक +40% CTR पाते हैं",
  viral_neg_em:"भावनात्मक शब्द नहीं — पावर वर्ड जोड़ें",
  viral_neg_desc_tpl:"छोटा विवरण (N अक्षर) — 500+ का लक्ष्य",
  viral_neg_len_short:"शीर्षक बहुत छोटा",
  viral_neg_len_long:"शीर्षक बहुत लंबा",
  viral_potential_title:"वायरल संभावित स्कोर",
  example_label:"उदाहरण:",recommendation_label:"सिफारिश:",
  impact_pos_num:"सकारात्मक प्रभाव +8% CTR",impact_neg_num:"अंक जोड़ने से CTR 15–40% बढ़ सकती है",
  btn_viral_ai:"✨ वायरल AI विश्लेषण",
  seo_tab_analyse:"📊 विश्लेषण",seo_tab_optim:"🎯 अनुकूलन",seo_tab_kw:"🔑 कीवर्ड",
  seo_tab_rec_kw:"अनुशंसित कीवर्ड",seo_tab_issues:"समस्याएं",seo_all_ok:"सभी मानदंड सत्यापित!",
    emotion_curiosity:"जिज्ञासा", emotion_surprise:"आश्चर्य",
    emotion_desire:"इच्छा", emotion_urgency:"तत्कालता", emotion_trust:"विश्वास",
    cl_len_why:"शीर्षक की लंबाई सीधे YouTube और Google परिणामों में प्रदर्शन को प्रभावित करती है। 55–70 अक्षर आदर्श हैं।",
    cl_num_why:"अंक शीर्षक को ठोस और मापने योग्य बनाते हैं। मानव आँख स्वाभाविक रूप से अंकों की ओर आकर्षित होती है।",
    cl_em_why2:"भावनात्मक शब्द एक तत्काल मनोवैज्ञानिक प्रतिक्रिया उत्पन्न करते हैं जो क्लिक करने के लिए प्रेरित करती है।",
    cl_hk_why2:"शीर्षक के पहले 3 शब्द सबसे अधिक पढ़े जाते हैं। प्रश्न रूप में हुक एक खुला मनोवैज्ञानिक पाश बनाता है।",
    cl_desc_why:"YouTube आपके विवरण पाठ को इंडेक्स करता है। समृद्ध विवरण एल्गोरिदम को वीडियो समझने में मदद करता है।",
    cl_len_s1:"नीच कीवर्ड जोड़ें", cl_len_s2:"सामग्री स्पष्ट करें", cl_len_s3:"मुख्य लाभ शामिल करें",
    cl_len_r1:"गैर-जरूरी शब्द हटाएं", cl_len_r2:"संक्षिप्त रूप उपयोग करें", cl_len_r3:"एक वाक्य में पुनः लिखें",
    cl_num_s1:"\"5 सुझाव...\" आज़माएं", cl_num_s2:"\"100% मुफ्त...\" आज़माएं", cl_num_s3:"\"10 मिनट में...\" आज़माएं",
    cl_em_s1:"\"अद्भुत\"", cl_em_s2:"\"मुफ्त\"", cl_em_s3:"\"रहस्य\"", cl_em_s4:"\"सर्वश्रेष्ठ\"",
    cl_hk_s1:"\"कैसे...\"", cl_hk_s2:"\"क्यों...\"", cl_hk_s3:"\"X सर्वश्रेष्ठ...\"",
    cl_desc_s1:"प्राकृतिक कीवर्ड जोड़ें", cl_desc_s2:"टाइमस्टैम्प शामिल करें", cl_desc_s3:"लिंक और CTA जोड़ें",
    cl_punct_s1:"प्रश्न जोड़ें", cl_punct_s2:"अंत में विस्मयादिबोधक जोड़ें",
    missing_kw_list:"ट्यूटोरियल,मुफ्त,पूर्ण,2024,शुरुआती,गाइड",
    comp_opp_label:"आपके विषय में अनछुए अवसर"
};

I18N.zh = {
  nav_coach:"🧠 教练", coach_potential:"视频潜力", coach_actions:"项操作", coach_fix:"修复", coach_grow:"寻找爆款灵感", coach_a_title:"优化你的标题", coach_w_title_kw:"标题需要SEO优化", coach_w_title_long:"标题太长（超过70个字符）", coach_a_thumb:"改进你的缩略图", coach_w_thumb:"缩略图有很大改进空间", coach_a_short:"发布关于此主题的Short", coach_w_short:"用Short提升你的爆款潜力", coach_ok_title:"标题OK", coach_ok_thumb:"缩略图OK", coach_ok_viral:"爆款潜力OK", coach_all_good:"你的视频已经优化得很好了！", sec_coach:"教练", sec_analyser:"分析", sec_creer:"创作", sec_studio:"工作室", sec_croissance:"增长",
    nav_overview:"概览", nav_seo:"SEO", nav_thumbnail:"缩略图",
  nav_viral:"病毒性", nav_competitor:"竞争对手", nav_titles:"AI标题", nav_actions:"操作",
  score_seo:"SEO评分", score_viral:"病毒评分", score_thumb:"缩略图评分",
  score_competition:"竞争", score_global:"综合评分",
  views:"次观看", desc_chars:"字符描述", title_chars:"字符标题",
  checklist_title:"SEO清单", criteria_ok:"标准通过",
  cl_len_label:"标题长度", cl_len_ok:n=>`${n}字符 — 完美`,
  cl_len_short:n=>`${n}字符 — 太短`, cl_len_long:n=>`${n}字符 — 太长`,
  cl_len_impact_ok:"YouTube SEO的最佳长度。",
  cl_len_impact_fix:n=>`标题${n}字符。SEO影响: ${n<45?"-15%":"-10%"}。目标55–70字符。`,
  cl_num_label:"标题中的数字", cl_num_ok:"检测到数字 — CTR提升",
  cl_num_fix:"没有数字。含数字标题可获+40% CTR。",
  cl_em_label:"情感词", cl_em_ok:"检测到力量词",
  cl_em_fix:'添加: "惊人"、"免费"、"秘密"、"最佳"',
  cl_hk_label:"CTR钩子", cl_hk_ok:"检测到好钩子",
  cl_hk_fix:'以"如何"、"为什么"或数字开头',
  cl_desc_label:"描述 (300+字符)", cl_desc_ok:n=>`${n}字符 — 很好`,
  cl_desc_fix:n=>`${n}字符 — 目标500+`,
  seo_title_analysis:"标题分析", seo_desc_analysis:"描述分析",
  seo_keywords:"检测到的关键词", seo_suggestions:"AI建议",
  seo_impact:"SEO影响", seo_recommendation:"建议",
  thumb_score:"缩略图评分", thumb_preview:"缩略图预览",
  thumb_emotions:"情感分析", thumb_strengths:"优势", thumb_weaknesses:"弱势",
  thumb_suggestions:"建议", thumb_download:"下载HD", thumb_copy_url:"复制URL",
  thumb_face:"检测到人脸", thumb_no_face:"无人脸", thumb_contrast:"对比度",
  thumb_text:"文字可读性", thumb_colors:"颜色", thumb_elements:"元素",
  thumb_good_contrast:"对比度良好", thumb_bad_contrast:"需要改善对比度",
  thumb_good_text:"文字可读", thumb_bad_text:"可读性需改善",
  thumb_format:"标准格式 — 最佳", thumb_face_proxy:"人脸检测需要代理",
  thumb_face_ok:"检测到有表情的人脸",
  thumb_rec1:"添加有表情人脸 (+38% CTR)", thumb_rec2:"大字体，最多4–6个词",
  thumb_rec3:"深色背景上的暖色", thumb_rec4:"箭头指向主要元素",
  thumb_current:"当前", thumb_potential:"潜力",
  thumb_ctr_current:"估计当前CTR", thumb_ctr_potential:"潜在CTR",
  viral_score:"病毒评分", viral_probability:"病毒概率",
  viral_low:"低", viral_medium:"中等", viral_high:"高",
  viral_factors_pos:"积极因素", viral_factors_neg:"限制因素",
  viral_prediction:"AI预测", viral_tips:"最大化技巧",
  viral_tip1:"在当地时间14–17时发布", viral_tip2:"在前30分钟内分享",
  viral_tip3:"在描述中添加时间戳", viral_tip4:"回复前10条评论",
  viral_current:"当前分数", viral_potential_label:"潜在分数",
  viral_possible_with:"修正后可能得分:",
  viral_fix_hook:"更好的CTR钩子", viral_fix_emotion:"强情感词",
  viral_fix_desc:"优化描述", viral_fix_number:"标题中的数字",
  comp_title:"竞争分析", comp_position:"您的位置",
  comp_keywords:"利基关键词", comp_missing:"缺失关键词",
  comp_opportunities:"机会", comp_note:"注意",
  comp_opp1:"您的主题中未开发的利基",
  comp_opp2:"竞争对手未涵盖的独特角度",
  comp_opp3:"此主题中长视频格式较少",
  comp_opp4:"中文版竞争较少",
  comp_pro_note:"实时竞争对手分析在Pro版本中可用。",
  titles_generate:"🚀 生成5个优化标题", titles_seo:"SEO版本",
  titles_ctr:"CTR版本", titles_viral:"病毒版本",
  titles_shorts:"Shorts版本", titles_trending:"趋势版本",
  titles_copy:"复制", titles_score:"分数",
  act_copy_title:"📋 复制标题", act_description:"📝 AI描述",
  act_tags:"🏷 AI标签", act_thumbnail:"🖼 HD缩略图",
  act_full_report:"✨ 完整AI报告",
  act_copy_desc:"📋 复制描述", act_copy_tags:"📋 复制所有标签",
  act_desc_label:"AI描述", act_tags_label:"AI标签和话题标签",
  act_tags_yt:"YouTube标签", act_hashtags:"话题标签",
  loading:"AI分析中…", loading_titles:"生成标题…",
  loading_desc:"生成描述…", loading_tags:"生成标签…",
  error_generic:"错误 — 检查代理", error_no_video:"未检测到视频",
  copied_title:"标题已复制 ✓", copied_desc:"描述已复制 ✓",
  copied_tags:"标签已复制 ✓", lang_changed:"语言已更改",
  plan_free:"免费", plan_pro:"Pro", plan_business:"商业",
  upgrade_msg:"升级到Pro解锁所有AI功能",
  upgrade_btn:"升级到Pro →",
  overview_gain_label:"修正后的潜力", overview_ctr_label:"估计CTR",
  seo_gain_potential:"SEO潜在提升", seo_current:"当前分数", seo_potential_label:"潜在分数",
  seo_action:"操作", seo_gain_col:"提升", seo_score_col:"分数", seo_total:"优化后合计",
  impact_very_high:"非常高", impact_high:"高", impact_medium:"中等", impact_low:"低",
  cl_punct_label:"CTR标点符号 (? 或 !)", cl_punct_ok:"有吸引力的标点",
  cl_punct_fix:"无CTR标点 — 添加 ? 或 !",
  cl_punct_why:"带 ? 或 ! 的标题点击率提高+15%。",
  cl_punct_gain:"+5 SEO分数",
  btn_report:"生成AI建议", rtl:"false",
  format_standard:"标准16:9格式",
  report_exec:"执行摘要", report_print:"🖨 打印", report_close:"✕ 关闭",
  report_seo_full:"完整SEO分析", report_viral_full:"完整病毒分析",
  report_thumb_full:"完整缩略图分析", report_comp_full:"完整竞争分析",
  report_titles:"生成的替代标题", report_opportunities:"检测到的机会",
  report_actions:"优先行动", report_charts:"分数分析",
  report_before_after:"优化前 / 后", report_loading:"生成高级报告…",
  report_no_data:"在YouTube视频上从VidSpark AI扩展打开此报告。",
  report_keywords:"标题关键词", report_missing_kw:"可能缺失的关键词",
  report_impact_table:"每次修正的估计SEO影响",
  report_ctr_current:"估计当前CTR", report_ctr_potential:"潜在CTR",
  report_emotions:"情感分析", report_visual_criteria:"视觉标准",
  report_opp_subject:"缺失主题", report_opp_kw:"关键词",
  report_opp_trend:"趋势", report_opp_niche:"利基",
  report_viral_impact:"每次修正的影响",
  report_comp_note_text:"实时竞争对手分析在Pro版本中通过YouTube Data API v3可用。",
  titles_seo_label:"SEO", titles_ctr_label:"CTR", titles_viral_label:"病毒性",
  titles_shorts_label:"Shorts", titles_trending_label:"趋势",
  viral_pos_hook:"标题开头有CTR钩子",
  viral_pos_num:"标题中有数字",
  viral_pos_em:"情感词存在",
  viral_pos_desc:"描述足够长",
  viral_pos_len:"标题长度最优",
  viral_neg_hook:"没有CTR钩子 — 在开头添加问题或数字",
  viral_neg_num:"没有数字 — 含数字标题获得+40% CTR",
  viral_neg_em:"没有情感词 — 添加力量词",
  viral_neg_desc_tpl:"短描述 (N字符) — 目标500+",
  viral_neg_len_short:"标题太短",
  viral_neg_len_long:"标题太长",
  viral_potential_title:"病毒潜力分数",
  example_label:"示例：",recommendation_label:"建议：",
  impact_pos_num:"正面影响 +8% CTR",impact_neg_num:"添加数字可将CTR提高15–40%",
  btn_viral_ai:"✨ 病毒AI分析",
  seo_tab_analyse:"📊 分析",seo_tab_optim:"🎯 优化",seo_tab_kw:"🔑 关键词",
  seo_tab_rec_kw:"推荐关键词",seo_tab_issues:"问题",seo_all_ok:"所有标准已验证!",
    emotion_curiosity:"好奇心", emotion_surprise:"惊讶",
    emotion_desire:"欲望", emotion_urgency:"紧迫感", emotion_trust:"信任",
    cl_len_why:"标题长度直接影响在YouTube和Google结果中的显示。55–70个字符是理想的。",
    cl_num_why:"数字使标题具体可测。人眼在文字流中自然被数字吸引。",
    cl_em_why2:"情感词触发即时的心理反应，促使点击。它们让您的视频在动态中脱颖而出。",
    cl_hk_why2:"标题的前3个词被阅读最多。问题形式的钩子创造一个开放的心理循环。",
    cl_desc_why:"YouTube索引您的描述文本。丰富的描述帮助算法理解和推荐您的视频。",
    cl_len_s1:"添加利基关键词", cl_len_s2:"明确内容", cl_len_s3:"包含主要好处",
    cl_len_r1:"删除非必要词语", cl_len_r2:"使用缩写", cl_len_r3:"用一句话改写",
    cl_num_s1:"尝试：\"5个技巧...\"", cl_num_s2:"尝试：\"100%免费...\"", cl_num_s3:"尝试：\"10分钟内...\"",
    cl_em_s1:"\"惊人\"", cl_em_s2:"\"免费\"", cl_em_s3:"\"秘密\"", cl_em_s4:"\"最佳\"",
    cl_hk_s1:"\"如何...\"", cl_hk_s2:"\"为什么...\"", cl_hk_s3:"\"X个最佳...\"",
    cl_desc_s1:"添加自然关键词", cl_desc_s2:"包含时间戳", cl_desc_s3:"添加链接和CTA",
    cl_punct_s1:"添加问题", cl_punct_s2:"在末尾添加感叹号",
    missing_kw_list:"教程,免费,完整,2024,初学者,指南",
    comp_opp_label:"您的主题中未开发的利基"
};

I18N.tr = {
  nav_coach:"🧠 Koç", coach_potential:"Video potansiyeli", coach_actions:"işlem", coach_fix:"Düzelt", coach_grow:"Viral bir fikir bul", coach_a_title:"Başlığını düzelt", coach_w_title_kw:"Başlık SEO optimizasyonu gerektiriyor", coach_w_title_long:"Başlık çok uzun (70 karakterden fazla)", coach_a_thumb:"Küçük resmini iyileştir", coach_w_thumb:"Küçük resmi iyileştirmek için büyük alan var", coach_a_short:"Bu konuda bir Short paylaş", coach_w_short:"Bir Short ile viral potansiyelini artır", coach_ok_title:"Başlık OK", coach_ok_thumb:"Küçük resim OK", coach_ok_viral:"Viral potansiyel OK", coach_all_good:"Videon zaten iyi optimize edilmiş!", sec_coach:"Koç", sec_analyser:"Analiz", sec_creer:"Oluştur", sec_studio:"Stüdyo", sec_croissance:"Büyüme",
    nav_overview:"Genel Bakış", nav_seo:"SEO", nav_thumbnail:"Küçük Resim",
  nav_viral:"Viral", nav_competitor:"Rakipler", nav_titles:"AI Başlıklar", nav_actions:"Eylemler",
  score_seo:"SEO Puanı", score_viral:"Viral Puan", score_thumb:"Küçük Resim Puanı",
  score_competition:"Rekabet", score_global:"Genel Puan",
  views:"görüntüleme", desc_chars:"karakter açıklama", title_chars:"karakter başlık",
  checklist_title:"SEO Kontrol Listesi", criteria_ok:"kriter geçildi",
  cl_len_label:"Başlık uzunluğu", cl_len_ok:n=>`${n} karakter — mükemmel`,
  cl_len_short:n=>`${n} karakter — çok kısa`, cl_len_long:n=>`${n} karakter — çok uzun`,
  cl_len_impact_ok:"YouTube SEO için ideal uzunluk.",
  cl_len_impact_fix:n=>`Başlık ${n} karakter. SEO etkisi: ${n<45?"-15%":"-10%"}. 55–70 karakter hedefleyin.`,
  cl_num_label:"Başlıkta sayı", cl_num_ok:"Sayı algılandı — CTR artışı",
  cl_num_fix:"Sayı yok. Sayılı başlıklar +40% CTR alır.",
  cl_em_label:"Duygusal kelime", cl_em_ok:"Güçlü kelime algılandı",
  cl_em_fix:'"İnanılmaz", "Ücretsiz", "Sır", "En iyi" ekleyin',
  cl_hk_label:"CTR kancası", cl_hk_ok:"İyi kanca algılandı",
  cl_hk_fix:'"Nasıl", "Neden" veya sayı ile başlayın',
  cl_desc_label:"Açıklama (300+ karakter)", cl_desc_ok:n=>`${n} karakter — iyi`,
  cl_desc_fix:n=>`${n} karakter — 500+ hedefle`,
  seo_title_analysis:"Başlık analizi", seo_desc_analysis:"Açıklama analizi",
  seo_keywords:"Algılanan anahtar kelimeler", seo_suggestions:"AI önerileri",
  seo_impact:"SEO etkisi", seo_recommendation:"Öneri",
  thumb_score:"Küçük Resim Puanı", thumb_preview:"Küçük resim önizleme",
  thumb_emotions:"Duygusal analiz", thumb_strengths:"Güçlü yönler", thumb_weaknesses:"Zayıf yönler",
  thumb_suggestions:"Öneriler", thumb_download:"HD İndir", thumb_copy_url:"URL Kopyala",
  thumb_face:"Yüz algılandı", thumb_no_face:"Yüz yok", thumb_contrast:"Kontrast",
  thumb_text:"Metin okunabilirliği", thumb_colors:"Renkler", thumb_elements:"Elementler",
  thumb_good_contrast:"İyi kontrast algılandı", thumb_bad_contrast:"Kontrast iyileştirilmeli",
  thumb_good_text:"Metin okunabilir", thumb_bad_text:"Okunabilirlik iyileştirilmeli",
  thumb_format:"Standart format — ideal", thumb_face_proxy:"Yüz tespiti proxy gerektirir",
  thumb_face_ok:"İfadeli yüz algılandı",
  thumb_rec1:"İfadeli yüz ekle (+38% CTR)", thumb_rec2:"Büyük metin, maks. 4–6 kelime",
  thumb_rec3:"Koyu arka planda sıcak renkler", thumb_rec4:"Ana öğeye ok veya daire",
  thumb_current:"Mevcut", thumb_potential:"Potansiyel",
  thumb_ctr_current:"Tahmini mevcut CTR", thumb_ctr_potential:"Potansiyel CTR",
  viral_score:"Viral Puan", viral_probability:"Viral olasılık",
  viral_low:"Düşük", viral_medium:"Orta", viral_high:"Yüksek",
  viral_factors_pos:"Olumlu faktörler", viral_factors_neg:"Sınırlayıcı faktörler",
  viral_prediction:"AI tahmini", viral_tips:"Maksimize etme ipuçları",
  viral_tip1:"Yerel saat 14–17 arası yayınlayın", viral_tip2:"İlk 30 dakikada paylaşın",
  viral_tip3:"Açıklamaya zaman damgaları ekleyin", viral_tip4:"İlk 10 yoruma cevap verin",
  viral_current:"Mevcut puan", viral_potential_label:"Potansiyel puan",
  viral_possible_with:"düzeltme ile puan mümkün:",
  viral_fix_hook:"Daha iyi CTR kancası", viral_fix_emotion:"Güçlü duygusal kelime",
  viral_fix_desc:"Optimize edilmiş açıklama", viral_fix_number:"Başlıkta sayı",
  comp_title:"Rekabet analizi", comp_position:"Konumunuz",
  comp_keywords:"Niş anahtar kelimeler", comp_missing:"Eksik anahtar kelimeler",
  comp_opportunities:"Fırsatlar", comp_note:"Not",
  comp_opp1:"Konunuzda kullanılmamış nişler",
  comp_opp2:"Rakipler tarafından kapsanmayan özgün açı",
  comp_opp3:"Bu konuda uzun format az temsil edilmiş",
  comp_opp4:"Türkçe versiyonu daha az rekabetçi",
  comp_pro_note:"Gerçek zamanlı rakip analizi Pro sürümde mevcut.",
  titles_generate:"🚀 5 başlık oluştur", titles_seo:"SEO versiyonu",
  titles_ctr:"CTR versiyonu", titles_viral:"Viral versiyon",
  titles_shorts:"Shorts versiyonu", titles_trending:"Trend versiyonu",
  titles_copy:"Kopyala", titles_score:"Puan",
  act_copy_title:"📋 Başlığı kopyala", act_description:"📝 AI Açıklama",
  act_tags:"🏷 AI Etiketler", act_thumbnail:"🖼 HD Küçük Resim",
  act_full_report:"✨ Tam AI Raporu",
  act_copy_desc:"📋 Açıklamayı kopyala", act_copy_tags:"📋 Tüm etiketleri kopyala",
  act_desc_label:"AI Açıklama", act_tags_label:"AI Etiketler ve Hashtag'ler",
  act_tags_yt:"YouTube Etiketleri", act_hashtags:"Hashtag'ler",
  loading:"AI analizi yapılıyor…", loading_titles:"Başlıklar oluşturuluyor…",
  loading_desc:"Açıklama oluşturuluyor…", loading_tags:"Etiketler oluşturuluyor…",
  error_generic:"Hata — proxy kontrol edin", error_no_video:"Video algılanmadı",
  copied_title:"Başlık kopyalandı ✓", copied_desc:"Açıklama kopyalandı ✓",
  copied_tags:"Etiketler kopyalandı ✓", lang_changed:"Dil değiştirildi",
  plan_free:"Ücretsiz", plan_pro:"Pro", plan_business:"İş",
  upgrade_msg:"Tüm AI özelliklerini açmak için Pro'ya geçin",
  upgrade_btn:"Pro'ya Geç →",
  overview_gain_label:"Düzeltilirse potansiyel", overview_ctr_label:"Tahmini CTR",
  seo_gain_potential:"SEO potansiyel kazanımı", seo_current:"Mevcut puan", seo_potential_label:"Potansiyel puan",
  seo_action:"Eylem", seo_gain_col:"Kazanım", seo_score_col:"Puan", seo_total:"Optimize edilmiş toplam",
  impact_very_high:"Çok Yüksek", impact_high:"Yüksek", impact_medium:"Orta", impact_low:"Düşük",
  cl_punct_label:"CTR noktalama (? veya !)", cl_punct_ok:"Çekici noktalama var",
  cl_punct_fix:"CTR noktalama yok — ? veya ! ekleyin",
  cl_punct_why:"? veya ! içeren başlıklar +15% daha fazla tıklanır.",
  cl_punct_gain:"+5 SEO puan",
  btn_report:"AI önerileri oluştur", rtl:"false",
  format_standard:"Standart 16:9 format",
  report_exec:"Yönetici Özeti", report_print:"🖨 Yazdır", report_close:"✕ Kapat",
  report_seo_full:"Tam SEO Analizi", report_viral_full:"Tam Viral Analizi",
  report_thumb_full:"Tam Küçük Resim Analizi", report_comp_full:"Tam Rekabet Analizi",
  report_titles:"Oluşturulan alternatif başlıklar", report_opportunities:"Tespit edilen fırsatlar",
  report_actions:"Öncelikli eylemler", report_charts:"Puan analizi",
  report_before_after:"Optimizasyon öncesi / sonrası", report_loading:"Premium rapor oluşturuluyor…",
  report_no_data:"YouTube videosunda VidSpark AI eklentisinden bu raporu açın.",
  report_keywords:"Başlık anahtar kelimeleri", report_missing_kw:"Potansiyel eksik anahtar kelimeler",
  report_impact_table:"Her düzeltme için tahmini SEO etkisi",
  report_ctr_current:"Tahmini mevcut CTR", report_ctr_potential:"Potansiyel CTR",
  report_emotions:"Duygusal analiz", report_visual_criteria:"Görsel kriterler",
  report_opp_subject:"Eksik konu", report_opp_kw:"Anahtar kelimeler",
  report_opp_trend:"Trend", report_opp_niche:"Niş",
  report_viral_impact:"Her düzeltmenin etkisi",
  report_comp_note_text:"Gerçek zamanlı rakip analizi Pro'da YouTube Data API v3 üzerinden mevcut.",
  titles_seo_label:"SEO", titles_ctr_label:"CTR", titles_viral_label:"Viral",
  titles_shorts_label:"Shorts", titles_trending_label:"Trend",
  viral_pos_hook:"Başlık başında CTR kancası",
  viral_pos_num:"Başlıkta sayı",
  viral_pos_em:"Duygusal kelime mevcut",
  viral_pos_desc:"Açıklama yeterince uzun",
  viral_pos_len:"Başlık uzunluğu ideal",
  viral_neg_hook:"CTR kancası yok — başa soru veya sayı ekleyin",
  viral_neg_num:"Sayı yok — sayılı başlıklar +40% CTR alır",
  viral_neg_em:"Duygusal kelime yok — güçlü kelime ekleyin",
  viral_neg_desc_tpl:"Kısa açıklama (N karakter) — hedef 500+",
  viral_neg_len_short:"Başlık çok kısa",
  viral_neg_len_long:"Başlık çok uzun",
  viral_potential_title:"Viral potansiyel puan",
  example_label:"Örnek:",recommendation_label:"ÖNERİ:",
  impact_pos_num:"Olumlu etki +8% CTR",impact_neg_num:"Sayı eklemek CTR'yi %15–40 artırabilir",
  btn_viral_ai:"✨ Viral AI Analizi",
  seo_tab_analyse:"📊 Analiz",seo_tab_optim:"🎯 Optimizasyon",seo_tab_kw:"🔑 Anahtar Kelimeler",
  seo_tab_rec_kw:"Önerilen anahtar kelimeler",seo_tab_issues:"sorunlar",seo_all_ok:"Tüm kriterler doğrulandı!",
    emotion_curiosity:"Merak", emotion_surprise:"Şaşkınlık",
    emotion_desire:"İstek", emotion_urgency:"Aciliyet", emotion_trust:"Güven",
    cl_len_why:"Başlık uzunluğu YouTube ve Google sonuçlarındaki görünümü doğrudan etkiler. 55–70 karakter idealdir.",
    cl_num_why:"Sayılar başlığı somut ve ölçülebilir yapar. İnsan gözü metin akışında sayılara doğal olarak çekilir.",
    cl_em_why2:"Duygusal kelimeler tıklamaya teşvik eden anlık psikolojik bir tepki tetikler.",
    cl_hk_why2:"Başlığın ilk 3 kelimesi en çok okunanlar. Soru formundaki kanca açık bir psikolojik döngü yaratır.",
    cl_desc_why:"YouTube açıklama metninizi indeksler. Zengin bir açıklama algoritmanın videonuzu anlamasına yardımcı olur.",
    cl_len_s1:"Niş anahtar kelimeler ekle", cl_len_s2:"İçeriği netleştir", cl_len_s3:"Ana faydayı dahil et",
    cl_len_r1:"Gereksiz kelimeleri kaldır", cl_len_r2:"Kısaltmalar kullan", cl_len_r3:"Tek cümlede yeniden ifade et",
    cl_num_s1:"\"5 ipucu...\" dene", cl_num_s2:"\"100% ücretsiz...\" dene", cl_num_s3:"\"10 dakikada...\" dene",
    cl_em_s1:"\"İnanılmaz\"", cl_em_s2:"\"Ücretsiz\"", cl_em_s3:"\"Sır\"", cl_em_s4:"\"En iyi\"",
    cl_hk_s1:"\"Nasıl...\"", cl_hk_s2:"\"Neden...\"", cl_hk_s3:"\"En iyi X...\"",
    cl_desc_s1:"Doğal anahtar kelimeler ekle", cl_desc_s2:"Zaman damgaları ekle", cl_desc_s3:"Bağlantılar ve CTA ekle",
    cl_punct_s1:"Soru ekle", cl_punct_s2:"Sonuna ünlem ekle",
    missing_kw_list:"eğitim,ücretsiz,tam,2024,başlangıç,rehber",
    comp_opp_label:"Konunuzda kullanılmamış nişler"
};

I18N.nl = {
  nav_coach:"🧠 Coach", coach_potential:"Videopotentieel", coach_actions:"acties", coach_fix:"Herstellen", coach_grow:"Vind een viraal idee", coach_a_title:"Verbeter je titel", coach_w_title_kw:"Titel heeft SEO-optimalisatie nodig", coach_w_title_long:"Titel te lang (meer dan 70 tekens)", coach_a_thumb:"Verbeter je thumbnail", coach_w_thumb:"Veel ruimte om de thumbnail te verbeteren", coach_a_short:"Plaats een Short over dit onderwerp", coach_w_short:"Verhoog je virale potentieel met een Short", coach_ok_title:"Titel OK", coach_ok_thumb:"Thumbnail OK", coach_ok_viral:"Viraal potentieel OK", coach_all_good:"Je video is al goed geoptimaliseerd!", sec_coach:"Coach", sec_analyser:"Analyseren", sec_creer:"Maken", sec_studio:"Studio", sec_croissance:"Groei",
    nav_overview:"Overzicht", nav_seo:"SEO", nav_thumbnail:"Miniatuur",
  nav_viral:"Viraal", nav_competitor:"Concurrenten", nav_titles:"AI Titels", nav_actions:"Acties",
  score_seo:"SEO Score", score_viral:"Virale Score", score_thumb:"Miniatuur Score",
  score_competition:"Concurrentie", score_global:"Totale Score",
  views:"weergaven", desc_chars:"tekens beschrijving", title_chars:"tekens titel",
  checklist_title:"SEO Checklist", criteria_ok:"criteria behaald",
  cl_len_label:"Titellengte", cl_len_ok:n=>`${n} tekens — perfect`,
  cl_len_short:n=>`${n} tekens — te kort`, cl_len_long:n=>`${n} tekens — te lang`,
  cl_len_impact_ok:"Optimale lengte voor YouTube SEO.",
  cl_len_impact_fix:n=>`Titel is ${n} tekens. SEO-impact: ${n<45?"-15%":"-10%"}. Doel 55–70 tekens.`,
  cl_num_label:"Getal in titel", cl_num_ok:"Getal gevonden — CTR boost",
  cl_num_fix:"Geen getal. Titels met getallen krijgen +40% CTR.",
  cl_em_label:"Emotioneel woord", cl_em_ok:"Krachtwoord gevonden",
  cl_em_fix:'"Ongelooflijk", "Gratis", "Geheim", "Beste" toevoegen',
  cl_hk_label:"CTR haak", cl_hk_ok:"Goede haak gevonden",
  cl_hk_fix:'Beginnen met "Hoe", "Waarom" of een getal',
  cl_desc_label:"Beschrijving (300+ tekens)", cl_desc_ok:n=>`${n} tekens — goed`,
  cl_desc_fix:n=>`${n} tekens — doel 500+`,
  seo_title_analysis:"Titelanalyse", seo_desc_analysis:"Beschrijvingsanalyse",
  seo_keywords:"Gedetecteerde trefwoorden", seo_suggestions:"AI-voorstellen",
  seo_impact:"SEO-impact", seo_recommendation:"Aanbeveling",
  thumb_score:"Miniatuur Score", thumb_preview:"Miniatuur voorbeeld",
  thumb_emotions:"Emotionele analyse", thumb_strengths:"Sterktes", thumb_weaknesses:"Zwaktes",
  thumb_suggestions:"Suggesties", thumb_download:"HD Downloaden", thumb_copy_url:"URL Kopiëren",
  thumb_face:"Gezicht gevonden", thumb_no_face:"Geen gezicht", thumb_contrast:"Contrast",
  thumb_text:"Tekstleesbaarheid", thumb_colors:"Kleuren", thumb_elements:"Elementen",
  thumb_good_contrast:"Goed contrast gevonden", thumb_bad_contrast:"Contrast moet verbeteren",
  thumb_good_text:"Tekst leesbaar", thumb_bad_text:"Leesbaarheid verbeteren",
  thumb_format:"Standaard formaat — optimaal", thumb_face_proxy:"Gezichtsdetectie vereist proxy",
  thumb_face_ok:"Expressief gezicht gevonden",
  thumb_rec1:"Expressief gezicht toevoegen (+38% CTR)", thumb_rec2:"Grote tekst, max. 4–6 woorden",
  thumb_rec3:"Warme kleuren op donkere achtergrond", thumb_rec4:"Pijl naar hoofdelement",
  thumb_current:"Huidig", thumb_potential:"Potentieel",
  thumb_ctr_current:"Geschatte huidige CTR", thumb_ctr_potential:"Potentiële CTR",
  viral_score:"Virale Score", viral_probability:"Virale kans",
  viral_low:"Laag", viral_medium:"Gemiddeld", viral_high:"Hoog",
  viral_factors_pos:"Positieve factoren", viral_factors_neg:"Beperkende factoren",
  viral_prediction:"AI-voorspelling", viral_tips:"Tips om te maximaliseren",
  viral_tip1:"Publiceren tussen 14–17 uur lokale tijd", viral_tip2:"Delen binnen eerste 30 minuten",
  viral_tip3:"Tijdstempels toevoegen aan beschrijving", viral_tip4:"Reageren op eerste 10 reacties",
  viral_current:"Huidige score", viral_potential_label:"Potentiële score",
  viral_possible_with:"punten mogelijk met:",
  viral_fix_hook:"Betere CTR haak", viral_fix_emotion:"Sterk emotioneel woord",
  viral_fix_desc:"Geoptimaliseerde beschrijving", viral_fix_number:"Getal in titel",
  comp_title:"Concurrentieanalyse", comp_position:"Uw positie",
  comp_keywords:"Niche trefwoorden", comp_missing:"Ontbrekende trefwoorden",
  comp_opportunities:"Kansen", comp_note:"Opmerking",
  comp_opp1:"Onontgonnen niches in uw onderwerp",
  comp_opp2:"Originele hoek niet gedekt door concurrenten",
  comp_opp3:"Lang formaat ondervertegenwoordigd in dit onderwerp",
  comp_opp4:"Nederlandse versie minder concurrerend",
  comp_pro_note:"Realtime concurrentieanalyse beschikbaar in Pro versie.",
  titles_generate:"🚀 5 geoptimaliseerde titels genereren", titles_seo:"SEO versie",
  titles_ctr:"CTR versie", titles_viral:"Virale versie",
  titles_shorts:"Shorts versie", titles_trending:"Trending versie",
  titles_copy:"Kopiëren", titles_score:"Score",
  act_copy_title:"📋 Titel kopiëren", act_description:"📝 AI Beschrijving",
  act_tags:"🏷 AI Tags", act_thumbnail:"🖼 HD Miniatuur",
  act_full_report:"✨ Volledig AI Rapport",
  act_copy_desc:"📋 Beschrijving kopiëren", act_copy_tags:"📋 Alle tags kopiëren",
  act_desc_label:"AI Beschrijving", act_tags_label:"AI Tags en Hashtags",
  act_tags_yt:"YouTube Tags", act_hashtags:"Hashtags",
  loading:"AI-analyse bezig…", loading_titles:"Titels genereren…",
  loading_desc:"Beschrijving genereren…", loading_tags:"Tags genereren…",
  error_generic:"Fout — proxy controleren", error_no_video:"Geen video gedetecteerd",
  copied_title:"Titel gekopieerd ✓", copied_desc:"Beschrijving gekopieerd ✓",
  copied_tags:"Tags gekopieerd ✓", lang_changed:"Taal gewijzigd",
  plan_free:"Gratis", plan_pro:"Pro", plan_business:"Zakelijk",
  upgrade_msg:"Upgrade naar Pro voor alle AI-functies",
  upgrade_btn:"Upgrade naar Pro →",
  overview_gain_label:"Potentieel indien gecorrigeerd", overview_ctr_label:"Geschatte CTR",
  seo_gain_potential:"SEO potentieel winst", seo_current:"Huidige score", seo_potential_label:"Potentiële score",
  seo_action:"Actie", seo_gain_col:"Winst", seo_score_col:"Score", seo_total:"Geoptimaliseerd totaal",
  impact_very_high:"Zeer Hoog", impact_high:"Hoog", impact_medium:"Gemiddeld", impact_low:"Laag",
  cl_punct_label:"CTR interpunctie (? of !)", cl_punct_ok:"Aantrekkelijke interpunctie aanwezig",
  cl_punct_fix:"Geen CTR interpunctie — ? of ! toevoegen",
  cl_punct_why:"Titels met ? of ! krijgen +15% meer klikken.",
  cl_punct_gain:"+5 SEO punten",
  btn_report:"AI suggesties genereren", rtl:"false",
  format_standard:"Standaard 16:9 formaat",
  report_exec:"Managementsamenvatting", report_print:"🖨 Afdrukken", report_close:"✕ Sluiten",
  report_seo_full:"Volledige SEO Analyse", report_viral_full:"Volledige Virale Analyse",
  report_thumb_full:"Volledige Miniatuur Analyse", report_comp_full:"Volledige Concurrentieanalyse",
  report_titles:"Gegenereerde alternatieve titels", report_opportunities:"Gedetecteerde kansen",
  report_actions:"Prioriteitsacties", report_charts:"Score-analyse",
  report_before_after:"Voor / Na optimalisatie", report_loading:"Premium rapport genereren…",
  report_no_data:"Open dit rapport vanuit de VidSpark AI extensie op een YouTube video.",
  report_keywords:"Titel trefwoorden", report_missing_kw:"Mogelijk ontbrekende trefwoorden",
  report_impact_table:"Geschatte SEO-impact per correctie",
  report_ctr_current:"Geschatte huidige CTR", report_ctr_potential:"Potentiële CTR",
  report_emotions:"Emotionele analyse", report_visual_criteria:"Visuele criteria",
  report_opp_subject:"Ontbrekend onderwerp", report_opp_kw:"Trefwoorden",
  report_opp_trend:"Trend", report_opp_niche:"Niche",
  report_viral_impact:"Impact van elke correctie",
  report_comp_note_text:"Realtime concurrentieanalyse beschikbaar in Pro via YouTube Data API v3.",
  titles_seo_label:"SEO", titles_ctr_label:"CTR", titles_viral_label:"Viraal",
  titles_shorts_label:"Shorts", titles_trending_label:"Trending",
    emotion_curiosity:"Nieuwsgierigheid", emotion_surprise:"Verrassing",
    emotion_desire:"Verlangen", emotion_urgency:"Urgentie", emotion_trust:"Vertrouwen",
    cl_len_why:"De titellengte beïnvloedt direct de weergave in YouTube- en Google-resultaten. Tussen 55 en 70 tekens is ideaal.",
    cl_num_why:"Getallen maken de titel concreet en meetbaar. Het menselijk oog wordt van nature aangetrokken door getallen.",
    cl_em_why2:"Emotionele woorden wekken een onmiddellijke psychologische reactie op die aanzet tot klikken.",
    cl_hk_why2:"De eerste 3 woorden van de titel worden het meest gelezen. Een haak als vraag creëert een open psychologische lus.",
    cl_desc_why:"YouTube indexeert uw beschrijvingstekst. Een rijke beschrijving helpt het algoritme uw video te begrijpen.",
    cl_len_s1:"Niché-trefwoorden toevoegen", cl_len_s2:"Inhoud verduidelijken", cl_len_s3:"Hoofdvoordeel opnemen",
    cl_len_r1:"Onnodige woorden verwijderen", cl_len_r2:"Afkortingen gebruiken", cl_len_r3:"In één zin herformuleren",
    cl_num_s1:"\"5 tips...\" proberen", cl_num_s2:"\"100% gratis...\" proberen", cl_num_s3:"\"In 10 minuten...\" proberen",
    cl_em_s1:"\"Ongelooflijk\"", cl_em_s2:"\"Gratis\"", cl_em_s3:"\"Geheim\"", cl_em_s4:"\"Ultiem\"",
    cl_hk_s1:"\"Hoe...\"", cl_hk_s2:"\"Waarom...\"", cl_hk_s3:"\"De X beste...\"",
    cl_desc_s1:"Natuurlijke trefwoorden toevoegen", cl_desc_s2:"Tijdstempels opnemen", cl_desc_s3:"Links en CTA toevoegen",
    cl_punct_s1:"Vraag toevoegen", cl_punct_s2:"Uitroepteken aan het einde",
    missing_kw_list:"tutorial,gratis,compleet,2024,beginner,handleiding",
    comp_opp_label:"Onontgonnen niches in uw onderwerp"
};

/* Fallback pour les langues non définies */
["zh","hi","ja","ru","ko","tr","nl"].forEach(c => {
  if (!I18N[c]) I18N[c] = Object.assign({}, I18N.en);
});

/* Traductions complémentaires (clés converties + nouvelles features).
   fr/en pour les clés nouvellement converties ; ar/ja complets.
   Les autres langues retombent sur l'anglais via T(). */
const EXTRA_I18N = {
  fr: {
    live_stats_title:"Stats réelles YouTube", live_stats_btn:"Charger les vraies données (vues/h, tags…)",
    audit_title:"Audit de la chaîne", audit_btn:"Auditer cette chaîne",
    thumb_ai_title:"Analyse miniature par IA", thumb_ai_btn:"Analyser ma miniature (IA)",
    thumb_ideas_title:"Générer des concepts de miniature", thumb_ideas_intro:"3 concepts (texte, couleurs, layout, visage) basés sur ton titre, prêts à exécuter.", thumb_ideas_btn:"Générer 3 concepts", thumb_ideas_loading:"Génération des concepts…", thumb_ideas_concept:"Concept", thumb_ideas_emotion:"Émotion", thumb_ideas_text:"Texte", thumb_ideas_focal:"Point focal", thumb_ideas_face:"Visage", thumb_ideas_bg:"Fond", thumb_ideas_why:"Pourquoi", thumb_ideas_copy:"Copier le brief", thumb_ideas_locked_sub:"Passe à Pro pour débloquer les 3 concepts", thumb_ideas_niche_ph:"Niche (optionnel, ex : cuisine, gaming)", thumb_gen_btn:"🖼️ Générer le fond", thumb_gen_loading:"Génération du fond…", thumb_gen_overlay_note:"Fond généré par IA + ton texte superposé (l'IA ne sait pas écrire le texte, surtout en arabe).", thumb_gen_text_ph:"Texte du titre sur l'image…", thumb_gen_download:"Télécharger l'image", thumb_gen_downloaded:"Image téléchargée", thumb_gen_drag_note:"2 lignes : tape ton texte, glisse chaque ligne, choisis couleur/taille/police, puis télécharge.", thumb_gen_line:"Ligne", thumb_gen_color:"Couleur", thumb_gen_font:"Police", thumb_gen_size:"Taille",
    real_comp_title:"Vrais concurrents", real_comp_btn:"Voir les vraies vidéos qui cartonnent",
    keywords_title:"Recherche de mots-clés", keywords_ph:"Ex: recette poulet",
    viral_potential_title:"Score viral potentiel", title_types:"Types de titres", result_label:"Résultat",
    hook_title:"Hook Analyzer", hook_intro:"Colle le script de ton intro (15-30 premières secondes) : l'IA prédit la rétention et où les gens décrochent.",
    hook_ph:"Colle ici le texte de ton intro…", hook_run:"Analyser la rétention", hook_need:"Colle au moins ton intro",
    hook_retention:"Rétention estimée", hook_score_label:"Score du hook", hook_drops:"⚠️ Points de décrochage", hook_fixes:"✅ Corrections", hook_rewrite:"💡 Intro réécrite (meilleure)",
    nav_region:"Région", audience_intro:"Choisis ta cible (mondial, région ou pays) et la langue : l'IA donne les meilleures heures, tendances, hashtags et sujets.",
    audience_target:"Cible (pays / région / mondial)", audience_target_ph:"Ex: Algérie, Maghreb, France, Mondial…", audience_worldwide:"Mondial",
    audience_niche:"Niche / style de la chaîne", audience_niche_ph:"Ex: Gaming, Cuisine, Tech, Foot…",
    audience_lang:"Langue du contenu", audience_run:"Optimiser pour cette audience",
    audience_times:"📅 Meilleures heures de publication", audience_trends:"📈 Tendances & formats", audience_hashtags:"🏷️ Hashtags localisés", audience_topics:"💡 Idées de sujets", audience_tips:"🎯 Conseils",
    nav_titles:"Titre & Desc", titles_section:"Titres IA",
    td_title:"Title Doctor", td_run:"Diagnostic IA approfondi", td_need:"Écris un titre d'abord",
    td_len:"Longueur", td_num:"Chiffre", td_emotion:"Mot émotionnel", td_hook:"Hook", td_punct:"Ponctuation",
    td_ai_score:"Score CTR", td_missing:"⚠️ Ce qui manque", td_improved:"💡 Titre amélioré", td_tips:"✅ Conseils",
    tdh_len:"Idéal entre 40 et 70 caractères : assez descriptif sans être coupé par YouTube.",
    tdh_num:"Un chiffre rend le titre concret (ex: 5 astuces, 2024) et attire l'œil.",
    tdh_emotion:"Un mot fort (incroyable, secret, gratuit, choquant…) déclenche le clic.",
    tdh_hook:"Une accroche au début (Comment, Pourquoi, une question…) crée la curiosité.",
    tdh_punct:"Un ? ou ! ajoute de l'émotion et donne envie de cliquer.",
    h_titledoctor:"Note ton titre en direct et propose une version optimisée pour plus de clics.",
    h_titles:"Génère 5 variantes de titres optimisés (SEO, CTR, viral, Shorts, trending).",
    h_desc:"Crée une description complète avec « abonne-toi », hashtags et 15 tags SEO.",
    h_abtest:"Compare 2 titres : l'IA prédit lequel aura le meilleur taux de clics.",
    h_thumbab:"Compare 2 miniatures : l'IA Vision dit laquelle attire le plus de clics et pourquoi.",
    h_shorts:"Transforme la vidéo en 3 idées de Shorts avec les passages exacts à couper.",
    h_hook:"Analyse ton intro et prédit la rétention + où les spectateurs décrochent.",
    h_audience:"Meilleures heures, tendances, hashtags et sujets selon ta région et ta niche.",
    h_revenue:"Estime les vues à 7 jours et les revenus AdSense de ta vidéo.",
    h_channel:"Stats réelles de la chaîne + score de santé et recommandations IA.",
    h_comments:"Résume le sentiment des commentaires, les demandes et suggère des réponses.",
    h_ideas:"Propose 10 idées de vidéos à fort potentiel adaptées à ta niche.",
    desc_section:"Description complète", desc_intro:"Titre + niche + région → description avec « abonne-toi », hashtags et tags.",
    desc_title:"Titre de la vidéo", desc_title_ph:"Titre de ta vidéo…", desc_run:"Générer la description complète", desc_need:"Entre un titre d'abord",
    desc_ready:"✅ Description prête à coller", desc_copy:"Copier la description", desc_tags:"🏷️ Tags SEO", desc_copy_tags:"Copier les tags",
    chap_section:"Chapitres", chap_intro:"Génère des chapitres horodatés (depuis les sous-titres) à coller dans ta description.", chap_run:"Générer les chapitres", chap_copy:"Copier les chapitres", chap_none:"Sous-titres indisponibles pour cette vidéo.",
    nav_revenue:"Revenus", rev_intro:"Estime les vues à 7 jours et les revenus AdSense selon ta niche, ton audience et tes abonnés.",
    rev_subs:"Abonnés de ta chaîne", rev_subs_ph:"Ex: 6m, 14k, 5000", rev_run:"Estimer vues & revenus", rev_views:"Vues (J+7)", rev_income:"Revenus estimés",
    rev_factors:"📊 Facteurs clés", rev_tips:"💡 Pour augmenter", rev_disclaimer:"Estimation indicative basée sur l'IA — les résultats réels peuvent varier.",
    nav_sponsor:"Sponsor", h_sponsor:"Estime ton tarif sponso, génère un pitch aux marques, un media-kit et des idées d'affiliation.",
    sp_intro:"Estime ta valeur sponso et génère un pitch + media-kit pour décrocher des partenariats.", sp_subs_ph:"Abonnés (ex: 6m, 14k)", sp_views_ph:"Vues moy./vidéo (ex: 50k)", sp_run:"Générer mon kit sponsor",
    sp_rate:"Tarif sponso estimé (par vidéo)", sp_pitch:"✉️ Message de pitch aux marques", sp_copy_pitch:"Copier le pitch",
    sp_mediakit:"📋 Media-kit (arguments)", sp_brands:"🏢 Marques qui iraient bien", sp_affiliate:"🔗 Idées d'affiliation", sp_disclaimer:"Estimation IA — négocie selon ton engagement réel.",
    nav_trends:"Tendances", h_trends:"Détecte ce qui explose en ce moment dans ta niche (vraies vidéos récentes) + analyse IA.",
    tre_intro:"Ce qui buzz MAINTENANT dans ta niche : vidéos qui explosent + tendances et mots-clés en hausse.", tre_run:"Détecter les tendances", tre_need:"Choisis une niche d'abord",
    tre_trends:"🔥 Tendances actuelles", tre_keywords:"📈 Mots-clés en hausse", tre_advice:"💡 Conseils pour surfer", tre_hot:"🚀 Vidéos qui explosent (récentes)", tre_none:"Aucune tendance trouvée. Essaie une niche plus large.",
    nav_planner:"Planning", h_planner:"Crée un calendrier de 7 jours adapté à ta niche pour publier régulièrement.",
    plan_intro:"Génère un planning de 7 jours : quoi publier chaque jour + le meilleur créneau.", plan_freq:"Rythme (optionnel)", plan_run:"Générer mon planning 7 jours",
    tr_section:"Localisation / Traduction", h_translate:"Traduit et adapte ton titre, description et tags vers une autre langue.",
    tr_intro:"Traduit titre + description + tags vers une langue pour toucher une audience mondiale.", tr_run:"Traduire", tr_title:"Titre traduit", tr_desc:"Description traduite", tr_copy:"Copier la traduction",
    cp_section:"Posts communautaires", h_community:"Génère des sondages, questions et teasers pour l'onglet Communauté.",
    cp_intro:"Génère 5 posts (sondages, questions, teasers) pour engager ton audience entre 2 vidéos.", cp_run:"Générer 5 posts",
    sc_section:"Script complet", h_script:"Écrit un script structuré (hook, sections, CTA) à partir d'un sujet.",
    sc_intro:"Donne un sujet : l'IA écrit le script complet (hook, intro, sections, CTA, conclusion).", sc_topic_ph:"Sujet de la vidéo…", sc_dur:"Durée", sc_run:"Écrire le script", sc_need:"Entre un sujet d'abord", sc_hook:"Hook (5 premières sec)", sc_copy:"Copier le script",
    pc_section:"Vérif Titre + Miniature", h_pair:"Vérifie que ton titre et ta miniature se complètent et sont lisibles sur TV et mobile.",
    pc_intro:"L'IA vérifie que ton titre et ta miniature se complètent (sans répéter) et leur lisibilité.", pc_run:"Vérifier la paire", pc_complement:"Complémentaires", pc_issues:"⚠️ Problèmes", pc_tips:"✅ Conseils",
    pl_section:"Optimiseur de playlists", h_playlists:"Regroupe tes vidéos en playlists optimisées pour le temps de session.",
    pl_intro:"L'IA regroupe tes vidéos en playlists optimisées (plus de temps de visionnage).", pl_run:"Optimiser mes playlists",
    au_section:"Audit complet 1-clic", h_audit:"Lance SEO + Miniature + Titre d'un coup et donne un plan d'action prioritaire.",
    au_run:"Lancer l'audit complet", au_global:"Score global de la vidéo", au_plan:"🎯 Plan d'action prioritaire",
    ob_title:"Bienvenue sur VidSpark AI !", ob_sub:"24 outils IA pour optimiser tes vidéos. Voici les essentiels :",
    ob_audit:"un audit complet en 1 clic", ob_title2:"score CTR de ton titre en direct", ob_thumb:"compare 2 miniatures", ob_shorts:"idées de Shorts + passages à couper", ob_sponsor:"estime tes revenus sponso", ob_btn:"C'est parti 🚀",
    nav_channel:"Chaîne", chan_intro:"Tableau de bord de la chaîne : stats réelles + score de santé et recommandations IA.", chan_run:"Analyser ma chaîne",
    chan_subs:"Abonnés", chan_views:"Vues totales", chan_vids:"Vidéos", chan_avg:"Vues moy.", chan_eng:"Engagement", chan_freq:"Fréquence",
    chan_ai_loading:"Diagnostic IA en cours…", chan_ai_fail:"Diagnostic IA indisponible", chan_health:"Score de santé", chan_strengths:"✅ Forces", chan_weak:"⚠️ Faiblesses", chan_reco:"💡 Recommandations",
    nav_comments:"Commentaires", com_intro:"L'IA lit les commentaires : sentiment, demandes de l'audience, idées de vidéos et réponses suggérées.", com_run:"Analyser les commentaires", com_none:"Aucun commentaire trouvé sur cette vidéo.", com_loading:"💬 Lecture & analyse des commentaires…",
    com_sentiment:"Sentiment global", com_pos:"Positif", com_neu:"Neutre", com_neg:"Négatif",
    com_requests:"🙋 Demandes de l'audience", com_ideas:"💡 Idées de prochaines vidéos", com_replies:"✍️ Réponses suggérées", com_copy:"Copier",
    nav_tiktok:"TikTok", tk_intro:"Donne ton sujet : l'IA génère légende, hooks, hashtags, mots-clés et script optimisés pour TikTok.", tk_topic_ph:"Sujet de ta vidéo TikTok…", tk_desc_ph:"Contexte / description (optionnel)…", tk_run:"Générer le SEO TikTok", tk_caption:"Légende optimisée", tk_keywords:"Mots-clés de recherche", tk_script:"Structure / script", tk_sound:"Conseil son / musique", tk_tips:"Conseils & découvrabilité", tk_need_topic:"Entre un sujet de vidéo.", tk_spin:"L'IA optimise ta vidéo TikTok…", tk_copy:"Copier", tkr_title:"YouTube → TikTok", tkr_intro:"Ouvre une vidéo YouTube : l'IA repère les meilleurs moments et donne les timecodes à couper pour TikTok.", tkr_novideo:"Ouvre d'abord une vidéo YouTube pour la découper.", tkr_run:"Convertir en TikTok", tkr_spin:"Découpage en clips TikTok…", tki_title:"Idées virales TikTok", tki_run:"Générer 10 idées", tki_spin:"Recherche d'idées virales…", tkh_title:"Optimiseur de hooks", tkh_run:"Générer 8 hooks", tkh_spin:"Génération des accroches…", tkc_title:"Calendrier de contenu", tkc_run:"Générer le calendrier 7 jours", tkc_spin:"Création du calendrier…", tkc_freq_ph:"Rythme (ex : 1 vidéo/jour)…",
    nav_ideas:"Idées", idea_intro:"Choisis ta niche, ta région et un sujet (optionnel) : l'IA propose 10 idées de vidéos à fort potentiel.", idea_topic_ph:"Sujet ou mot-clé (optionnel)…", idea_run:"Générer 10 idées", idea_copy:"Copier le titre",
    kw_opportunity:"Score d'opportunité", kw_difficulty:"Difficulté", kw_demand:"Demande", kw_trend:"Tendance", kw_best:"🎯 Mots-clés à viser", kw_competition:"Concurrence"
  },
  en: {
    live_stats_title:"Real YouTube stats", live_stats_btn:"Load real data (views/h, tags…)",
    audit_title:"Channel audit", audit_btn:"Audit this channel",
    thumb_ai_title:"AI thumbnail analysis", thumb_ai_btn:"Analyze my thumbnail (AI)",
    thumb_ideas_title:"Generate thumbnail concepts", thumb_ideas_intro:"3 concepts (text, colors, layout, face) based on your title, ready to execute.", thumb_ideas_btn:"Generate 3 concepts", thumb_ideas_loading:"Generating concepts…", thumb_ideas_concept:"Concept", thumb_ideas_emotion:"Emotion", thumb_ideas_text:"Text", thumb_ideas_focal:"Focal point", thumb_ideas_face:"Face", thumb_ideas_bg:"Background", thumb_ideas_why:"Why", thumb_ideas_copy:"Copy brief", thumb_ideas_locked_sub:"Upgrade to Pro to unlock all 3 concepts", thumb_ideas_niche_ph:"Niche (optional, e.g. cooking, gaming)", thumb_gen_btn:"🖼️ Generate background", thumb_gen_loading:"Generating background…", thumb_gen_overlay_note:"AI-generated background + your overlaid text (image AI can't render text, especially Arabic).", thumb_gen_text_ph:"Title text on the image…", thumb_gen_download:"Download image", thumb_gen_downloaded:"Image downloaded", thumb_gen_drag_note:"2 lines: type your text, drag each line, pick color/size/font, then download.", thumb_gen_line:"Line", thumb_gen_color:"Color", thumb_gen_font:"Font", thumb_gen_size:"Size",
    real_comp_title:"Real competitors", real_comp_btn:"See the real videos crushing it",
    keywords_title:"Keyword research", keywords_ph:"e.g. chicken recipe",
    viral_potential_title:"Viral potential score", title_types:"Title types", result_label:"Result",
    hook_title:"Hook Analyzer", hook_intro:"Paste your intro script (first 15-30 sec): AI predicts retention and where viewers drop off.",
    hook_ph:"Paste your intro text here…", hook_run:"Analyze retention", hook_need:"Paste at least your intro",
    hook_retention:"Est. retention", hook_score_label:"Hook score", hook_drops:"⚠️ Drop-off points", hook_fixes:"✅ Fixes", hook_rewrite:"💡 Rewritten intro (better)",
    nav_region:"Region", audience_intro:"Pick your target (worldwide, region or country) and language: AI gives best times, trends, hashtags and topics.",
    audience_target:"Target (country / region / worldwide)", audience_target_ph:"e.g. Algeria, MENA, France, Worldwide…", audience_worldwide:"Worldwide",
    audience_niche:"Niche / channel style", audience_niche_ph:"e.g. Gaming, Cooking, Tech, Football…",
    audience_lang:"Content language", audience_run:"Optimize for this audience",
    audience_times:"📅 Best posting times", audience_trends:"📈 Trends & formats", audience_hashtags:"🏷️ Localized hashtags", audience_topics:"💡 Topic ideas", audience_tips:"🎯 Tips",
    nav_titles:"Title & Desc", titles_section:"AI Titles",
    td_title:"Title Doctor", td_run:"Deep AI diagnosis", td_need:"Type a title first",
    td_len:"Length", td_num:"Number", td_emotion:"Power word", td_hook:"Hook", td_punct:"Punctuation",
    td_ai_score:"CTR score", td_missing:"⚠️ What's missing", td_improved:"💡 Improved title", td_tips:"✅ Tips",
    tdh_len:"Ideal 40-70 characters: descriptive enough without being cut off by YouTube.",
    tdh_num:"A number makes the title concrete (e.g. 5 tips, 2024) and catches the eye.",
    tdh_emotion:"A power word (amazing, secret, free, shocking…) triggers the click.",
    tdh_hook:"A hook at the start (How, Why, a question…) creates curiosity.",
    tdh_punct:"A ? or ! adds emotion and makes people want to click.",
    h_titledoctor:"Scores your title live and suggests an optimized version for more clicks.",
    h_titles:"Generates 5 optimized title variants (SEO, CTR, viral, Shorts, trending).",
    h_desc:"Creates a full description with a subscribe CTA, hashtags and 15 SEO tags.",
    h_abtest:"Compares 2 titles: AI predicts which gets the higher click-through rate.",
    h_thumbab:"Compares 2 thumbnails: Vision AI tells which gets more clicks and why.",
    h_shorts:"Turns the video into 3 Shorts ideas with the exact clips to cut.",
    h_hook:"Analyzes your intro and predicts retention + where viewers drop off.",
    h_audience:"Best times, trends, hashtags and topics for your region and niche.",
    h_revenue:"Estimates 7-day views and AdSense revenue for your video.",
    h_channel:"Real channel stats + health score and AI recommendations.",
    h_comments:"Summarizes comment sentiment, requests and suggests replies.",
    h_ideas:"Suggests 10 high-potential video ideas tailored to your niche.",
    desc_section:"Full description", desc_intro:"Title + niche + region → description with a subscribe CTA, hashtags and tags.",
    desc_title:"Video title", desc_title_ph:"Your video title…", desc_run:"Generate full description", desc_need:"Enter a title first",
    desc_ready:"✅ Ready-to-paste description", desc_copy:"Copy description", desc_tags:"🏷️ SEO tags", desc_copy_tags:"Copy tags",
    chap_section:"Chapters", chap_intro:"Generate timestamped chapters (from captions) to paste in your description.", chap_run:"Generate chapters", chap_copy:"Copy chapters", chap_none:"Captions unavailable for this video.",
    nav_revenue:"Revenue", rev_intro:"Estimate 7-day views and AdSense revenue based on your niche, audience and subscribers.",
    rev_subs:"Your channel subscribers", rev_subs_ph:"e.g. 6m, 14k, 5000", rev_run:"Estimate views & revenue", rev_views:"Views (D+7)", rev_income:"Est. revenue",
    rev_factors:"📊 Key factors", rev_tips:"💡 To increase", rev_disclaimer:"AI-based estimate — actual results may vary.",
    nav_sponsor:"Sponsor", h_sponsor:"Estimates your sponsorship rate, generates a brand pitch, a media kit and affiliate ideas.",
    sp_intro:"Estimate your sponsorship value and generate a pitch + media kit to land deals.", sp_subs_ph:"Subscribers (e.g. 6m, 14k)", sp_views_ph:"Avg views/video (e.g. 50k)", sp_run:"Generate my sponsor kit",
    sp_rate:"Estimated sponsorship rate (per video)", sp_pitch:"✉️ Brand pitch message", sp_copy_pitch:"Copy pitch",
    sp_mediakit:"📋 Media kit (selling points)", sp_brands:"🏢 Brands that would fit", sp_affiliate:"🔗 Affiliate ideas", sp_disclaimer:"AI estimate — negotiate based on your real engagement.",
    nav_trends:"Trends", h_trends:"Detects what's exploding right now in your niche (real recent videos) + AI analysis.",
    tre_intro:"What's buzzing NOW in your niche: exploding videos + rising trends and keywords.", tre_run:"Detect trends", tre_need:"Pick a niche first",
    tre_trends:"🔥 Current trends", tre_keywords:"📈 Rising keywords", tre_advice:"💡 How to ride them", tre_hot:"🚀 Exploding videos (recent)", tre_none:"No trends found. Try a broader niche.",
    nav_planner:"Planner", h_planner:"Creates a 7-day calendar tailored to your niche to post consistently.",
    plan_intro:"Generate a 7-day plan: what to post each day + the best time slot.", plan_freq:"Cadence (optional)", plan_run:"Generate my 7-day plan",
    tr_section:"Localization / Translation", h_translate:"Translates and adapts your title, description and tags into another language.",
    tr_intro:"Translate title + description + tags into a language to reach a global audience.", tr_run:"Translate", tr_title:"Translated title", tr_desc:"Translated description", tr_copy:"Copy translation",
    cp_section:"Community posts", h_community:"Generates polls, questions and teasers for the Community tab.",
    cp_intro:"Generate 5 posts (polls, questions, teasers) to engage your audience between videos.", cp_run:"Generate 5 posts",
    sc_section:"Full script", h_script:"Writes a structured script (hook, sections, CTA) from a topic.",
    sc_intro:"Give a topic: AI writes the full script (hook, intro, sections, CTA, outro).", sc_topic_ph:"Video topic…", sc_dur:"Duration", sc_run:"Write the script", sc_need:"Enter a topic first", sc_hook:"Hook (first 5 sec)", sc_copy:"Copy script",
    pc_section:"Title + Thumbnail check", h_pair:"Checks that your title and thumbnail complement each other and are readable on TV and mobile.",
    pc_intro:"AI checks that your title and thumbnail complement each other (no repeat) and their readability.", pc_run:"Check the pair", pc_complement:"Complementary", pc_issues:"⚠️ Issues", pc_tips:"✅ Tips",
    pl_section:"Playlist optimizer", h_playlists:"Groups your videos into optimized playlists for session time.",
    pl_intro:"AI groups your videos into optimized playlists (more watch time).", pl_run:"Optimize my playlists",
    au_section:"1-click full audit", h_audit:"Runs SEO + Thumbnail + Title at once and gives a prioritized action plan.",
    au_run:"Run full audit", au_global:"Overall video score", au_plan:"🎯 Priority action plan",
    ob_title:"Welcome to VidSpark AI!", ob_sub:"24 AI tools to optimize your videos. Here are the essentials:",
    ob_audit:"a 1-click full audit", ob_title2:"live CTR score for your title", ob_thumb:"compare 2 thumbnails", ob_shorts:"Shorts ideas + clips to cut", ob_sponsor:"estimate your sponsorship income", ob_btn:"Let's go 🚀",
    nav_channel:"Channel", chan_intro:"Channel dashboard: real stats + health score and AI recommendations.", chan_run:"Analyze my channel",
    chan_subs:"Subscribers", chan_views:"Total views", chan_vids:"Videos", chan_avg:"Avg views", chan_eng:"Engagement", chan_freq:"Frequency",
    chan_ai_loading:"AI diagnosis in progress…", chan_ai_fail:"AI diagnosis unavailable", chan_health:"Health score", chan_strengths:"✅ Strengths", chan_weak:"⚠️ Weaknesses", chan_reco:"💡 Recommendations",
    nav_comments:"Comments", com_intro:"AI reads the comments: sentiment, audience requests, video ideas and suggested replies.", com_run:"Analyze comments", com_none:"No comments found on this video.", com_loading:"💬 Reading & analyzing comments…",
    com_sentiment:"Overall sentiment", com_pos:"Positive", com_neu:"Neutral", com_neg:"Negative",
    com_requests:"🙋 Audience requests", com_ideas:"💡 Next video ideas", com_replies:"✍️ Suggested replies", com_copy:"Copy",
    nav_tiktok:"TikTok", tk_intro:"Enter your topic: AI generates a caption, hooks, hashtags, keywords and script optimized for TikTok.", tk_topic_ph:"Your TikTok video topic…", tk_desc_ph:"Context / description (optional)…", tk_run:"Generate TikTok SEO", tk_caption:"Optimized caption", tk_keywords:"Search keywords", tk_script:"Structure / script", tk_sound:"Sound / music tip", tk_tips:"Tips & discoverability", tk_need_topic:"Enter a video topic.", tk_spin:"AI is optimizing your TikTok video…", tk_copy:"Copy", tkr_title:"YouTube → TikTok", tkr_intro:"Open a YouTube video: AI finds the best moments and gives the timecodes to cut for TikTok.", tkr_novideo:"Open a YouTube video first to repurpose it.", tkr_run:"Convert to TikTok", tkr_spin:"Cutting into TikTok clips…", tki_title:"Viral TikTok ideas", tki_run:"Generate 10 ideas", tki_spin:"Finding viral ideas…", tkh_title:"Hook optimizer", tkh_run:"Generate 8 hooks", tkh_spin:"Generating hooks…", tkc_title:"Content calendar", tkc_run:"Generate 7-day calendar", tkc_spin:"Building calendar…", tkc_freq_ph:"Cadence (e.g. 1 video/day)…",
    nav_ideas:"Ideas", idea_intro:"Pick your niche, region and an optional topic: AI suggests 10 high-potential video ideas.", idea_topic_ph:"Topic or keyword (optional)…", idea_run:"Generate 10 ideas", idea_copy:"Copy title",
    kw_opportunity:"Opportunity score", kw_difficulty:"Difficulty", kw_demand:"Demand", kw_trend:"Trend", kw_best:"🎯 Keywords to target", kw_competition:"Competition"
  },
  ar: {
    thumb_ideas_title:"توليد مفاهيم الصورة المصغّرة", thumb_ideas_intro:"3 مفاهيم (نص، ألوان، تخطيط، وجه) بناءً على عنوانك، جاهزة للتنفيذ.", thumb_ideas_btn:"توليد 3 مفاهيم", thumb_ideas_loading:"جارٍ توليد المفاهيم…", thumb_ideas_concept:"مفهوم", thumb_ideas_emotion:"العاطفة", thumb_ideas_text:"النص", thumb_ideas_focal:"نقطة التركيز", thumb_ideas_face:"الوجه", thumb_ideas_bg:"الخلفية", thumb_ideas_why:"لماذا", thumb_ideas_copy:"نسخ الملخّص", thumb_ideas_locked_sub:"ترقَّ إلى Pro لفتح المفاهيم الثلاثة", thumb_ideas_niche_ph:"المجال (اختياري، مثل: طبخ، ألعاب)",
    thumb_gen_btn:"🖼️ توليد الخلفية", thumb_gen_loading:"جارٍ توليد الخلفية…", thumb_gen_overlay_note:"خلفية مولّدة بالذكاء الاصطناعي + نصّك المُراكَب (الذكاء الاصطناعي لا يجيد كتابة النص، خاصة بالعربية).", thumb_gen_text_ph:"نص العنوان على الصورة…", thumb_gen_download:"تنزيل الصورة", thumb_gen_downloaded:"تم تنزيل الصورة", thumb_gen_drag_note:"سطران: اكتب نصّك، اسحب كل سطر، اختر اللون/الحجم/الخط، ثم نزّل.", thumb_gen_line:"السطر", thumb_gen_color:"اللون", thumb_gen_font:"الخط", thumb_gen_size:"الحجم",
    live_stats_title:"إحصائيات يوتيوب الحقيقية", live_stats_btn:"تحميل البيانات الحقيقية (مشاهدات/س، وسوم…)",
    audit_title:"تدقيق القناة", audit_btn:"تدقيق هذه القناة",
    thumb_ai_title:"تحليل الصورة المصغّرة بالذكاء الاصطناعي", thumb_ai_btn:"حلّل صورتي المصغّرة (ذكاء اصطناعي)",
    real_comp_title:"منافسون حقيقيون", real_comp_btn:"شاهد الفيديوهات الحقيقية الناجحة",
    keywords_title:"بحث الكلمات المفتاحية", keywords_ph:"مثال: وصفة دجاج",
    viral_potential_title:"درجة الانتشار المحتملة", title_types:"أنواع العناوين", result_label:"النتيجة",
    hook_title:"محلّل الجاذبية", hook_intro:"الصق نص مقدمتك (أول 15-30 ثانية): يتنبأ الذكاء الاصطناعي بنسبة البقاء وأين يغادر المشاهدون.",
    hook_ph:"الصق نص المقدمة هنا…", hook_run:"تحليل البقاء", hook_need:"الصق مقدمتك على الأقل",
    hook_retention:"البقاء المقدّر", hook_score_label:"درجة الجاذبية", hook_drops:"⚠️ نقاط المغادرة", hook_fixes:"✅ تصحيحات", hook_rewrite:"💡 مقدمة معاد كتابتها (أفضل)",
    nav_region:"المنطقة", audience_intro:"اختر جمهورك المستهدف (عالمي، منطقة أو دولة) واللغة: يعطيك الذكاء الاصطناعي أفضل الأوقات والاتجاهات والوسوم والمواضيع.",
    audience_target:"الهدف (دولة / منطقة / عالمي)", audience_target_ph:"مثال: الجزائر، المغرب العربي، فرنسا، عالمي…", audience_worldwide:"عالمي",
    audience_niche:"المجال / أسلوب القناة", audience_niche_ph:"مثال: ألعاب، طبخ، تقنية، كرة قدم…",
    audience_lang:"لغة المحتوى", audience_run:"تحسين لهذا الجمهور",
    audience_times:"📅 أفضل أوقات النشر", audience_trends:"📈 الاتجاهات والصيغ", audience_hashtags:"🏷️ وسوم محلية", audience_topics:"💡 أفكار مواضيع", audience_tips:"🎯 نصائح",
    nav_titles:"العنوان والوصف", titles_section:"عناوين AI",
    td_title:"طبيب العنوان", td_run:"تشخيص معمّق بالذكاء الاصطناعي", td_need:"اكتب عنوانًا أولاً",
    td_len:"الطول", td_num:"رقم", td_emotion:"كلمة عاطفية", td_hook:"خطّاف", td_punct:"علامة ترقيم",
    td_ai_score:"درجة CTR", td_missing:"⚠️ ما الذي ينقص", td_improved:"💡 عنوان محسّن", td_tips:"✅ نصائح",
    tdh_len:"الأفضل بين 40 و70 حرفًا: وصفي بما يكفي دون أن يقطعه يوتيوب.",
    tdh_num:"الرقم يجعل العنوان ملموسًا (مثل: 5 نصائح، 2024) ويلفت الانتباه.",
    tdh_emotion:"كلمة قوية (مذهل، سر، مجاني، صادم…) تحفّز النقر.",
    tdh_hook:"خطّاف في البداية (كيف، لماذا، سؤال…) يثير الفضول.",
    tdh_punct:"علامة ؟ أو ! تضيف العاطفة وتشجّع على النقر.",
    h_titledoctor:"يقيّم عنوانك مباشرة ويقترح نسخة محسّنة لمزيد من النقرات.",
    h_titles:"يولّد 5 صيغ عناوين محسّنة (SEO، CTR، فيروسي، Shorts، رائج).",
    h_desc:"ينشئ وصفًا كاملًا مع « اشترك »، وسوم و15 تاغ SEO.",
    h_abtest:"يقارن عنوانين: يتنبأ الذكاء الاصطناعي بأيهما يحقق نسبة نقر أعلى.",
    h_thumbab:"يقارن صورتين مصغّرتين: يخبرك الذكاء الاصطناعي البصري أيّهما أفضل ولماذا.",
    h_shorts:"يحوّل الفيديو إلى 3 أفكار Shorts مع المقاطع المراد قصّها.",
    h_hook:"يحلّل مقدمتك ويتنبأ بنسبة البقاء وأين يغادر المشاهدون.",
    h_audience:"أفضل الأوقات والاتجاهات والوسوم والمواضيع حسب منطقتك ومجالك.",
    h_revenue:"يقدّر المشاهدات خلال 7 أيام وأرباح AdSense لفيديوك.",
    h_channel:"إحصائيات حقيقية للقناة + درجة الصحة وتوصيات الذكاء الاصطناعي.",
    h_comments:"يلخّص مشاعر التعليقات والطلبات ويقترح ردودًا.",
    h_ideas:"يقترح 10 أفكار فيديو عالية الإمكانات مناسبة لمجالك.",
    desc_section:"وصف كامل", desc_intro:"العنوان + المجال + المنطقة ← وصف مع « اشترك »، وسوم وتاغات.",
    desc_title:"عنوان الفيديو", desc_title_ph:"عنوان فيديوك…", desc_run:"توليد الوصف الكامل", desc_need:"أدخل عنوانًا أولاً",
    desc_ready:"✅ وصف جاهز للصق", desc_copy:"نسخ الوصف", desc_tags:"🏷️ وسوم SEO", desc_copy_tags:"نسخ التاغات",
    chap_section:"الفصول", chap_intro:"أنشئ فصولًا موقّتة (من الترجمة) للصقها في وصف الفيديو.", chap_run:"إنشاء الفصول", chap_copy:"نسخ الفصول", chap_none:"الترجمة غير متاحة لهذا الفيديو.",
    nav_revenue:"الأرباح", rev_intro:"قدّر المشاهدات خلال 7 أيام وأرباح AdSense حسب مجالك وجمهورك ومشتركيك.",
    rev_subs:"عدد مشتركي قناتك", rev_subs_ph:"مثال: 6m، 14k، 5000", rev_run:"تقدير المشاهدات والأرباح", rev_views:"المشاهدات (7 أيام)", rev_income:"الأرباح المقدّرة",
    rev_factors:"📊 العوامل الرئيسية", rev_tips:"💡 لزيادتها", rev_disclaimer:"تقدير تقريبي بالذكاء الاصطناعي — قد تختلف النتائج الفعلية.",
    nav_sponsor:"الرعاية", h_sponsor:"يقدّر سعر رعايتك، ويولّد رسالة للعلامات التجارية وملفًا إعلاميًا وأفكار أفلييت.",
    sp_intro:"قدّر قيمتك للرعاية وولّد رسالة + ملف إعلامي للحصول على شراكات.", sp_subs_ph:"المشتركون (مثل: 6m، 14k)", sp_views_ph:"متوسط المشاهدات/فيديو (مثل: 50k)", sp_run:"توليد ملف الرعاية",
    sp_rate:"سعر الرعاية المقدّر (لكل فيديو)", sp_pitch:"✉️ رسالة للعلامات التجارية", sp_copy_pitch:"نسخ الرسالة",
    sp_mediakit:"📋 الملف الإعلامي (نقاط القوة)", sp_brands:"🏢 علامات مناسبة", sp_affiliate:"🔗 أفكار أفلييت", sp_disclaimer:"تقدير بالذكاء الاصطناعي — تفاوض حسب تفاعلك الحقيقي.",
    nav_trends:"الاتجاهات", h_trends:"يكتشف ما ينتشر الآن في مجالك (فيديوهات حقيقية حديثة) + تحليل بالذكاء الاصطناعي.",
    tre_intro:"ما الذي ينتشر الآن في مجالك: فيديوهات تنفجر + اتجاهات وكلمات مفتاحية صاعدة.", tre_run:"اكتشاف الاتجاهات", tre_need:"اختر مجالًا أولاً",
    tre_trends:"🔥 الاتجاهات الحالية", tre_keywords:"📈 كلمات مفتاحية صاعدة", tre_advice:"💡 كيف تستفيد منها", tre_hot:"🚀 فيديوهات تنفجر (حديثة)", tre_none:"لا توجد اتجاهات. جرّب مجالًا أوسع.",
    nav_planner:"التخطيط", h_planner:"ينشئ تقويمًا لـ7 أيام مناسبًا لمجالك للنشر بانتظام.",
    plan_intro:"يولّد خطة 7 أيام: ماذا تنشر كل يوم + أفضل وقت.", plan_freq:"الإيقاع (اختياري)", plan_run:"توليد خطة 7 أيام",
    tr_section:"الترجمة والتوطين", h_translate:"يترجم ويكيّف عنوانك ووصفك ووسومك إلى لغة أخرى.",
    tr_intro:"ترجم العنوان + الوصف + الوسوم إلى لغة للوصول إلى جمهور عالمي.", tr_run:"ترجمة", tr_title:"العنوان المترجم", tr_desc:"الوصف المترجم", tr_copy:"نسخ الترجمة",
    cp_section:"منشورات المجتمع", h_community:"يولّد استطلاعات وأسئلة وإعلانات تشويقية لتبويب المجتمع.",
    cp_intro:"يولّد 5 منشورات (استطلاعات، أسئلة، تشويق) لإشراك جمهورك بين الفيديوهات.", cp_run:"توليد 5 منشورات",
    sc_section:"سكربت كامل", h_script:"يكتب سكربتًا منظّمًا (خطّاف، أقسام، CTA) من موضوع.",
    sc_intro:"أعطِ موضوعًا: يكتب الذكاء الاصطناعي السكربت الكامل (خطّاف، مقدمة، أقسام، CTA، خاتمة).", sc_topic_ph:"موضوع الفيديو…", sc_dur:"المدة", sc_run:"كتابة السكربت", sc_need:"أدخل موضوعًا أولاً", sc_hook:"الخطّاف (أول 5 ثوانٍ)", sc_copy:"نسخ السكربت",
    pc_section:"فحص العنوان + الصورة", h_pair:"يتحقق من تكامل عنوانك وصورتك المصغّرة ووضوحهما على التلفاز والجوال.",
    pc_intro:"يتحقق الذكاء الاصطناعي من تكامل العنوان والصورة (دون تكرار) ومن وضوحهما.", pc_run:"فحص الزوج", pc_complement:"متكاملان", pc_issues:"⚠️ مشاكل", pc_tips:"✅ نصائح",
    pl_section:"محسّن قوائم التشغيل", h_playlists:"يجمّع فيديوهاتك في قوائم تشغيل محسّنة لزمن الجلسة.",
    pl_intro:"يجمّع الذكاء الاصطناعي فيديوهاتك في قوائم تشغيل محسّنة (وقت مشاهدة أطول).", pl_run:"تحسين قوائم التشغيل",
    au_section:"تدقيق كامل بنقرة", h_audit:"يشغّل SEO + الصورة + العنوان دفعة واحدة ويعطي خطة عمل ذات أولوية.",
    au_run:"تشغيل التدقيق الكامل", au_global:"الدرجة الإجمالية للفيديو", au_plan:"🎯 خطة عمل ذات أولوية",
    ob_title:"مرحبًا بك في VidSpark AI!", ob_sub:"24 أداة ذكاء اصطناعي لتحسين فيديوهاتك. إليك الأساسيات:",
    ob_audit:"تدقيق كامل بنقرة واحدة", ob_title2:"درجة CTR لعنوانك مباشرة", ob_thumb:"قارن صورتين مصغّرتين", ob_shorts:"أفكار Shorts + المقاطع للقص", ob_sponsor:"قدّر دخلك من الرعاية", ob_btn:"لننطلق 🚀",
    nav_channel:"القناة", chan_intro:"لوحة القناة: إحصائيات حقيقية + درجة الصحة وتوصيات الذكاء الاصطناعي.", chan_run:"تحليل قناتي",
    chan_subs:"المشتركون", chan_views:"إجمالي المشاهدات", chan_vids:"الفيديوهات", chan_avg:"متوسط المشاهدات", chan_eng:"التفاعل", chan_freq:"التكرار",
    chan_ai_loading:"جاري التشخيص بالذكاء الاصطناعي…", chan_ai_fail:"التشخيص غير متاح", chan_health:"درجة الصحة", chan_strengths:"✅ نقاط القوة", chan_weak:"⚠️ نقاط الضعف", chan_reco:"💡 توصيات",
    nav_comments:"التعليقات", com_intro:"يقرأ الذكاء الاصطناعي التعليقات: المشاعر، طلبات الجمهور، أفكار فيديوهات وردود مقترحة.", com_run:"تحليل التعليقات", com_none:"لا توجد تعليقات على هذا الفيديو.", com_loading:"💬 قراءة وتحليل التعليقات…",
    com_sentiment:"المشاعر العامة", com_pos:"إيجابي", com_neu:"محايد", com_neg:"سلبي",
    com_requests:"🙋 طلبات الجمهور", com_ideas:"💡 أفكار للفيديوهات القادمة", com_replies:"✍️ ردود مقترحة", com_copy:"نسخ",
    nav_tiktok:"تيك توك", tk_intro:"أدخل موضوعك: يولّد الذكاء الاصطناعي وصفًا وجُملًا افتتاحية ووسوماً وكلمات مفتاحية ونصًا مُحسّناً لتيك توك.", tk_topic_ph:"موضوع فيديو تيك توك الخاص بك…", tk_desc_ph:"السياق / الوصف (اختياري)…", tk_run:"توليد سيو تيك توك", tk_caption:"الوصف المُحسّن", tk_keywords:"كلمات البحث المفتاحية", tk_script:"الهيكل / النص", tk_sound:"نصيحة الصوت / الموسيقى", tk_tips:"نصائح والاكتشاف", tk_need_topic:"أدخل موضوع الفيديو.", tk_spin:"الذكاء الاصطناعي يُحسّن فيديو تيك توك…", tk_copy:"نسخ", tkr_title:"يوتيوب → تيك توك", tkr_intro:"افتح فيديو يوتيوب: يحدد الذكاء الاصطناعي أفضل اللحظات ويعطيك التوقيتات للقص من أجل تيك توك.", tkr_novideo:"افتح فيديو يوتيوب أولاً لإعادة استخدامه.", tkr_run:"تحويل إلى تيك توك", tkr_spin:"تقطيع إلى مقاطع تيك توك…", tki_title:"أفكار تيك توك رائجة", tki_run:"توليد 10 أفكار", tki_spin:"البحث عن أفكار رائجة…", tkh_title:"محسّن الجُمل الافتتاحية", tkh_run:"توليد 8 جُمل", tkh_spin:"توليد الجُمل الافتتاحية…", tkc_title:"تقويم المحتوى", tkc_run:"توليد تقويم 7 أيام", tkc_spin:"إنشاء التقويم…", tkc_freq_ph:"الوتيرة (مثال: فيديو واحد يوميًا)…",
    nav_ideas:"أفكار", idea_intro:"اختر مجالك ومنطقتك وموضوعًا (اختياري): يقترح الذكاء الاصطناعي 10 أفكار فيديو عالية الإمكانات.", idea_topic_ph:"موضوع أو كلمة مفتاحية (اختياري)…", idea_run:"توليد 10 أفكار", idea_copy:"نسخ العنوان",
    kw_opportunity:"درجة الفرصة", kw_difficulty:"الصعوبة", kw_demand:"الطلب", kw_trend:"الاتجاه", kw_best:"🎯 كلمات مفتاحية مستهدفة", kw_competition:"المنافسة",
    nav_abtest:"اختبار A/B", nav_shorts:"Shorts",
    abtest_intro:"قارن عنوانين: يتنبأ الذكاء الاصطناعي بأيهما يحقق نسبة نقر أعلى.", abtest_a:"العنوان A", abtest_b:"العنوان B",
    abtest_run:"⚔️ قارن العناوين", abtest_winner:"الفائز", abtest_verdict:"حكم الذكاء الاصطناعي",
    abtest_improved:"💡 عنوان مقترح (أفضل)", abtest_ctr:"نسبة النقر المقدّرة", abtest_confidence:"الثقة", abtest_use:"استخدم هذا العنوان",
    shorts_intro:"حوّل هذا الفيديو إلى أفكار Shorts فيروسية (عنوان، خطاف، نص، وسوم).", shorts_generate:"🎬 توليد Shorts",
    shorts_hook:"الخطاف (أول 3 ثوانٍ)", shorts_script:"النص", shorts_duration:"المدة", shorts_copy:"نسخ النص",
    shorts_summary:"ملخّص", shorts_clips:"✂️ المقاطع المراد قصّها", shorts_estimated:"تقديري", shorts_real:"حسب الترجمة",
    thumbab_title:"اختبار A/B للصور المصغّرة", thumbab_intro:"قارن صورتين مصغّرتين: يخبرك الذكاء الاصطناعي البصري أيّهما يحقق نسبة نقر أعلى ولماذا.",
    thumbab_a:"الصورة A", thumbab_b:"الصورة B", thumbab_run:"📸 قارن الصور المصغّرة", thumbab_tips:"💡 لتحسين الفائزة", thumbab_need2:"اختر صورتين أولاً",
    thumbab_prompt_label:"🎨 وصف مفصّل لإنشاء الصورة المصغّرة المحسّنة:", thumbab_prompt_copy:"نسخ الوصف",
    thumbab_prompt_hint:"الصق هذا الوصف في ذكاء اصطناعي للصور (Midjourney، DALL·E، ChatGPT، Leonardo…) لتوليد صورتك.",
    tk_ready:"المحتوى جاهز للنشر", tk_hooks:"الجُمل الافتتاحية",
    tkr_ready:"المقاطع جاهزة للقص", tk_clips:"مقاطع",
    tki_ready:"الأفكار جاهزة", tk_ideas:"أفكار",
    tkh_ready:"الجُمل الافتتاحية جاهزة",
    tkc_ready:"التقويم جاهز", tk_days:"أيام"
  },
  ja: {
    thumb_ideas_title:"サムネイルのコンセプトを生成", thumb_ideas_intro:"タイトルに基づく3つのコンセプト（テキスト、配色、レイアウト、顔）、すぐ実行可能。", thumb_ideas_btn:"3つのコンセプトを生成", thumb_ideas_loading:"コンセプトを生成中…", thumb_ideas_concept:"コンセプト", thumb_ideas_emotion:"感情", thumb_ideas_text:"テキスト", thumb_ideas_focal:"焦点", thumb_ideas_face:"顔", thumb_ideas_bg:"背景", thumb_ideas_why:"理由", thumb_ideas_copy:"ブリーフをコピー", thumb_ideas_locked_sub:"Proにアップグレードして3つのコンセプトをすべて解除", thumb_ideas_niche_ph:"ニッチ（任意、例：料理、ゲーム）",
    thumb_gen_btn:"🖼️ 背景を生成", thumb_gen_loading:"背景を生成中…", thumb_gen_overlay_note:"AI生成の背景＋重ねたテキスト（画像AIは特にアラビア語のテキストをうまく書けません）。", thumb_gen_text_ph:"画像上のタイトルテキスト…", thumb_gen_download:"画像をダウンロード", thumb_gen_downloaded:"画像をダウンロードしました", thumb_gen_drag_note:"2行：テキストを入力し、各行をドラッグ、色/サイズ/フォントを選んでダウンロード。", thumb_gen_line:"行", thumb_gen_color:"色", thumb_gen_font:"フォント", thumb_gen_size:"サイズ",
    live_stats_title:"実際のYouTube統計", live_stats_btn:"実データを読み込む（視聴/時、タグ…）",
    audit_title:"チャンネル監査", audit_btn:"このチャンネルを監査",
    thumb_ai_title:"AIサムネイル分析", thumb_ai_btn:"サムネイルをAI分析",
    real_comp_title:"実際の競合", real_comp_btn:"伸びている実際の動画を見る",
    keywords_title:"キーワード調査", keywords_ph:"例：チキンレシピ",
    viral_potential_title:"バイラル潜在スコア", title_types:"タイトルの種類", result_label:"結果",
    hook_title:"フック分析", hook_intro:"イントロの台本（最初の15〜30秒）を貼り付け：AIが視聴維持率と離脱箇所を予測します。",
    hook_ph:"ここにイントロのテキストを貼り付け…", hook_run:"維持率を分析", hook_need:"少なくともイントロを貼り付けてください",
    hook_retention:"推定維持率", hook_score_label:"フックスコア", hook_drops:"⚠️ 離脱ポイント", hook_fixes:"✅ 修正案", hook_rewrite:"💡 書き直したイントロ（改善版）",
    nav_region:"地域", audience_intro:"ターゲット（世界・地域・国）と言語を選択：AIが最適な投稿時間、トレンド、ハッシュタグ、トピックを提案します。",
    audience_target:"ターゲット（国／地域／世界）", audience_target_ph:"例：アルジェリア、中東、フランス、世界…", audience_worldwide:"世界",
    audience_niche:"ニッチ／チャンネルのスタイル", audience_niche_ph:"例：ゲーム、料理、テック、サッカー…",
    audience_lang:"コンテンツの言語", audience_run:"この層に最適化",
    audience_times:"📅 最適な投稿時間", audience_trends:"📈 トレンドと形式", audience_hashtags:"🏷️ ローカルハッシュタグ", audience_topics:"💡 トピック案", audience_tips:"🎯 ヒント",
    nav_titles:"タイトル＆説明", titles_section:"AIタイトル",
    td_title:"タイトルドクター", td_run:"AIで詳しく診断", td_need:"先にタイトルを入力",
    td_len:"長さ", td_num:"数字", td_emotion:"感情ワード", td_hook:"フック", td_punct:"句読点",
    td_ai_score:"CTRスコア", td_missing:"⚠️ 不足している点", td_improved:"💡 改善タイトル", td_tips:"✅ ヒント",
    tdh_len:"40〜70文字が理想：説明的で、YouTubeで切れない長さ。",
    tdh_num:"数字（例：5つのコツ、2024）でタイトルが具体的になり目を引く。",
    tdh_emotion:"強い言葉（驚き・秘密・無料・衝撃…）がクリックを促す。",
    tdh_hook:"冒頭のフック（どうやって・なぜ・質問…）が好奇心を生む。",
    tdh_punct:"？や！は感情を加えクリックしたくなる。",
    h_titledoctor:"タイトルをリアルタイムで採点し、クリックを増やす改善案を提案。",
    h_titles:"最適化タイトルを5案生成（SEO、CTR、バイラル、Shorts、トレンド）。",
    h_desc:"登録CTA・ハッシュタグ・SEOタグ15個付きの完全な説明文を作成。",
    h_abtest:"2つのタイトルを比較：AIがどちらのCTRが高いか予測。",
    h_thumbab:"2つのサムネを比較：ビジョンAIがどちらが良いか理由とともに提示。",
    h_shorts:"動画を3つのShortsアイデアに変換し、切り出す場面を提示。",
    h_hook:"イントロを分析し、視聴維持率と離脱箇所を予測。",
    h_audience:"地域とニッチに応じた最適時間・トレンド・ハッシュタグ・トピック。",
    h_revenue:"動画の7日間再生数とAdSense収益を推定。",
    h_channel:"チャンネルの実データ＋健全性スコアとAI提案。",
    h_comments:"コメントの感情と要望を要約し、返信案を提案。",
    h_ideas:"ニッチに合った有望な動画アイデアを10件提案。",
    desc_section:"完全な説明", desc_intro:"タイトル＋ニッチ＋地域 → 「チャンネル登録」CTA・ハッシュタグ・タグ付きの説明。",
    desc_title:"動画タイトル", desc_title_ph:"動画のタイトル…", desc_run:"完全な説明を生成", desc_need:"先にタイトルを入力",
    desc_ready:"✅ 貼り付け可能な説明", desc_copy:"説明をコピー", desc_tags:"🏷️ SEOタグ", desc_copy_tags:"タグをコピー",
    chap_section:"チャプター", chap_intro:"字幕からタイムスタンプ付きチャプターを生成し、説明欄に貼り付け。", chap_run:"チャプターを生成", chap_copy:"チャプターをコピー", chap_none:"この動画は字幕が利用できません。",
    nav_revenue:"収益", rev_intro:"ニッチ・視聴者層・登録者数に基づいて7日間の再生数とAdSense収益を予測します。",
    rev_subs:"チャンネル登録者数", rev_subs_ph:"例: 6m、14k、5000", rev_run:"再生数と収益を予測", rev_views:"再生数（7日）", rev_income:"推定収益",
    rev_factors:"📊 主な要因", rev_tips:"💡 増やすには", rev_disclaimer:"AIによる概算 — 実際の結果は異なる場合があります。",
    nav_sponsor:"スポンサー", h_sponsor:"スポンサー料金を見積もり、ブランド向けの売り込み文・メディアキット・アフィリエイト案を生成。",
    sp_intro:"スポンサー価値を見積もり、契約獲得用の売り込み文＋メディアキットを生成。", sp_subs_ph:"登録者（例: 6m, 14k）", sp_views_ph:"平均再生数/動画（例: 50k）", sp_run:"スポンサーキットを生成",
    sp_rate:"推定スポンサー料金（動画あたり）", sp_pitch:"✉️ ブランドへの売り込み文", sp_copy_pitch:"売り込み文をコピー",
    sp_mediakit:"📋 メディアキット（訴求点）", sp_brands:"🏢 相性の良いブランド", sp_affiliate:"🔗 アフィリエイト案", sp_disclaimer:"AI概算 — 実際のエンゲージメントに応じて交渉を。",
    nav_trends:"トレンド", h_trends:"あなたのニッチで今伸びているもの（実際の最近の動画）を検出＋AI分析。",
    tre_intro:"あなたのニッチで今バズっているもの：急上昇動画＋トレンドと急上昇キーワード。", tre_run:"トレンドを検出", tre_need:"先にニッチを選択",
    tre_trends:"🔥 現在のトレンド", tre_keywords:"📈 急上昇キーワード", tre_advice:"💡 活用のヒント", tre_hot:"🚀 急上昇動画（最近）", tre_none:"トレンドが見つかりません。より広いニッチをお試しください。",
    nav_planner:"プランナー", h_planner:"ニッチに合わせた7日間のカレンダーを作成し、定期投稿を支援。",
    plan_intro:"7日間の計画を生成：毎日何を投稿するか＋最適な時間帯。", plan_freq:"ペース（任意）", plan_run:"7日間の計画を生成",
    tr_section:"ローカライズ／翻訳", h_translate:"タイトル・説明・タグを別の言語に翻訳・最適化。",
    tr_intro:"タイトル＋説明＋タグを翻訳し、世界の視聴者にリーチ。", tr_run:"翻訳", tr_title:"翻訳タイトル", tr_desc:"翻訳した説明", tr_copy:"翻訳をコピー",
    cp_section:"コミュニティ投稿", h_community:"コミュニティタブ用のアンケート・質問・予告を生成。",
    cp_intro:"動画の合間に視聴者を引き込む5つの投稿（アンケート・質問・予告）を生成。", cp_run:"5投稿を生成",
    sc_section:"完全な台本", h_script:"トピックから構成された台本（フック・セクション・CTA）を作成。",
    sc_intro:"トピックを入力：AIが完全な台本（フック・導入・セクション・CTA・締め）を作成。", sc_topic_ph:"動画のトピック…", sc_dur:"長さ", sc_run:"台本を書く", sc_need:"先にトピックを入力", sc_hook:"フック（最初の5秒）", sc_copy:"台本をコピー",
    pc_section:"タイトル＋サムネ確認", h_pair:"タイトルとサムネが補完し合い、TVとモバイルで読めるか確認。",
    pc_intro:"AIがタイトルとサムネの補完性（重複なし）と可読性を確認。", pc_run:"ペアを確認", pc_complement:"補完的", pc_issues:"⚠️ 問題点", pc_tips:"✅ ヒント",
    pl_section:"再生リスト最適化", h_playlists:"動画をセッション時間向けの最適な再生リストにグループ化。",
    pl_intro:"AIが動画を最適な再生リストにグループ化（視聴時間アップ）。", pl_run:"再生リストを最適化",
    au_section:"1クリック総合監査", h_audit:"SEO＋サムネ＋タイトルを一度に実行し、優先アクションプランを提示。",
    au_run:"総合監査を実行", au_global:"動画の総合スコア", au_plan:"🎯 優先アクションプラン",
    ob_title:"VidSpark AIへようこそ！", ob_sub:"動画最適化のための24のAIツール。主要なものはこちら：",
    ob_audit:"1クリックの総合監査", ob_title2:"タイトルのCTRをリアルタイム採点", ob_thumb:"2つのサムネを比較", ob_shorts:"Shortsアイデア＋切り出し場面", ob_sponsor:"スポンサー収入を見積もり", ob_btn:"始めよう 🚀",
    nav_channel:"チャンネル", chan_intro:"チャンネルダッシュボード：実データ＋健全性スコアとAI提案。", chan_run:"チャンネルを分析",
    chan_subs:"登録者", chan_views:"総再生数", chan_vids:"動画数", chan_avg:"平均再生数", chan_eng:"エンゲージ", chan_freq:"頻度",
    chan_ai_loading:"AI診断中…", chan_ai_fail:"AI診断は利用できません", chan_health:"健全性スコア", chan_strengths:"✅ 強み", chan_weak:"⚠️ 弱み", chan_reco:"💡 提案",
    nav_comments:"コメント", com_intro:"AIがコメントを分析：感情、視聴者の要望、動画アイデア、返信案。", com_run:"コメントを分析", com_none:"この動画にコメントはありません。", com_loading:"💬 コメントを読み込んで分析中…",
    com_sentiment:"全体の感情", com_pos:"ポジティブ", com_neu:"中立", com_neg:"ネガティブ",
    com_requests:"🙋 視聴者の要望", com_ideas:"💡 次の動画アイデア", com_replies:"✍️ 返信案", com_copy:"コピー",
    nav_ideas:"アイデア", idea_intro:"ニッチ・地域・トピック（任意）を選択：AIが有望な動画アイデアを10件提案。", idea_topic_ph:"トピックまたはキーワード（任意）…", idea_run:"10案を生成", idea_copy:"タイトルをコピー",
    kw_opportunity:"機会スコア", kw_difficulty:"難易度", kw_demand:"需要", kw_trend:"トレンド", kw_best:"🎯 狙うキーワード", kw_competition:"競合",
    nav_abtest:"A/Bテスト", nav_shorts:"Shorts",
    abtest_intro:"2つのタイトルを比較：AIがどちらのクリック率が高いか予測します。", abtest_a:"タイトルA", abtest_b:"タイトルB",
    abtest_run:"⚔️ タイトルを比較", abtest_winner:"勝者", abtest_verdict:"AIの判定",
    abtest_improved:"💡 提案タイトル（さらに良い）", abtest_ctr:"推定CTR", abtest_confidence:"信頼度", abtest_use:"このタイトルを使う",
    shorts_intro:"この動画をバイラルなShortsのアイデアに変換（タイトル、フック、台本、ハッシュタグ）。", shorts_generate:"🎬 Shortsを生成",
    shorts_hook:"フック（最初の3秒）", shorts_script:"台本", shorts_duration:"長さ", shorts_copy:"台本をコピー",
    shorts_summary:"要約", shorts_clips:"✂️ 切り出す場面", shorts_estimated:"推定", shorts_real:"字幕に基づく",
    thumbab_title:"サムネイルA/B", thumbab_intro:"2つのサムネイルを比較：ビジョンAIがどちらのCTRが高いか理由とともに教えます。",
    thumbab_a:"サムネイルA", thumbab_b:"サムネイルB", thumbab_run:"📸 サムネイルを比較", thumbab_tips:"💡 勝者を改善するには", thumbab_need2:"先に2枚選んでください",
    thumbab_prompt_label:"🎨 改善版サムネイルを作る詳細プロンプト：", thumbab_prompt_copy:"プロンプトをコピー",
    thumbab_prompt_hint:"このプロンプトを画像AI（Midjourney、DALL·E、ChatGPT、Leonardo…）に貼り付けてサムネイルを生成。"
  }
};
Object.keys(EXTRA_I18N).forEach(l => { if (I18N[l]) Object.assign(I18N[l], EXTRA_I18N[l]); });

/* ── FILL_I18N : complète les langues partielles (fusion uniquement si clé absente) ── */
const FILL_I18N = {
 "es": {
  "nav_abtest": "Test A/B",
  "abtest_intro": "Compara dos títulos: la IA predice cuál obtiene más clics.",
  "abtest_a": "Título A",
  "abtest_b": "Título B",
  "abtest_run": "⚔️ Comparar títulos",
  "abtest_winner": "Ganador",
  "abtest_verdict": "Veredicto IA",
  "abtest_improved": "💡 Título sugerido (aún mejor)",
  "abtest_ctr": "CTR est.",
  "abtest_confidence": "Confianza",
  "abtest_use": "Usar este título",
  "thumbab_title": "Miniatura A/B",
  "thumbab_intro": "Compara 2 miniaturas: la IA Vision dice cuál logra más CTR y por qué.",
  "thumbab_a": "Miniatura A",
  "thumbab_b": "Miniatura B",
  "thumbab_run": "📸 Comparar miniaturas",
  "thumbab_tips": "💡 Para mejorar la ganadora",
  "thumbab_need2": "Elige 2 imágenes primero",
  "thumbab_prompt_label": "🎨 Prompt detallado para crear la miniatura mejorada:",
  "thumbab_prompt_copy": "Copiar prompt",
  "thumbab_prompt_hint": "Pega este prompt en una IA de imágenes (Midjourney, DALL·E, ChatGPT, Leonardo…) para generar tu miniatura.",
  "nav_shorts": "Shorts",
  "shorts_intro": "Convierte este vídeo en ideas de Shorts virales (título, gancho, guion, hashtags).",
  "shorts_generate": "🎬 Generar Shorts",
  "shorts_hook": "Gancho (primeros 3 s)",
  "shorts_script": "Guion",
  "shorts_duration": "Duración",
  "shorts_copy": "Copiar guion",
  "shorts_summary": "Resumen",
  "shorts_clips": "✂️ Clips para cortar",
  "shorts_estimated": "estimado",
  "shorts_real": "según los subtítulos",
  "live_stats_title": "Estadísticas reales de YouTube",
  "live_stats_btn": "Cargar datos reales (vistas/h, etiquetas…)",
  "audit_title": "Auditoría del canal",
  "audit_btn": "Auditar este canal",
  "thumb_ai_title": "Análisis de miniatura con IA",
  "thumb_ai_btn": "Analizar mi miniatura (IA)",
  "thumb_ideas_title": "Generar conceptos de miniatura",
  "thumb_ideas_intro": "3 conceptos (texto, colores, diseño, rostro) según tu título, listos para ejecutar.",
  "thumb_ideas_btn": "Generar 3 conceptos",
  "thumb_ideas_loading": "Generando conceptos…",
  "thumb_ideas_concept": "Concepto",
  "thumb_ideas_emotion": "Emoción",
  "thumb_ideas_text": "Texto",
  "thumb_ideas_focal": "Punto focal",
  "thumb_ideas_face": "Rostro",
  "thumb_ideas_bg": "Fondo",
  "thumb_ideas_why": "Por qué",
  "thumb_ideas_copy": "Copiar resumen",
  "thumb_ideas_locked_sub": "Pásate a Pro para desbloquear los 3 conceptos",
  "thumb_ideas_niche_ph": "Nicho (opcional, p. ej. cocina, gaming)",
  "thumb_gen_btn": "🖼️ Generar fondo",
  "thumb_gen_loading": "Generando fondo…",
  "thumb_gen_overlay_note": "Fondo generado por IA + tu texto superpuesto (la IA de imágenes no escribe bien el texto, sobre todo en árabe).",
  "thumb_gen_text_ph": "Texto del título sobre la imagen…",
  "thumb_gen_download": "Descargar imagen",
  "thumb_gen_downloaded": "Imagen descargada",
  "thumb_gen_drag_note": "2 líneas: escribe tu texto, arrastra cada línea, elige color/tamaño/fuente y descarga.",
  "thumb_gen_line": "Línea",
  "thumb_gen_color": "Color",
  "thumb_gen_font": "Fuente",
  "thumb_gen_size": "Tamaño",
  "real_comp_title": "Competidores reales",
  "real_comp_btn": "Ver los vídeos reales que arrasan",
  "keywords_title": "Investigación de palabras clave",
  "keywords_ph": "p. ej. receta de pollo",
  "title_types": "Tipos de título",
  "result_label": "Resultado",
  "hook_title": "Analizador de ganchos",
  "hook_intro": "Pega el guion de tu intro (primeros 15-30 s): la IA predice la retención y dónde se van los espectadores.",
  "hook_ph": "Pega aquí el texto de tu intro…",
  "hook_run": "Analizar retención",
  "hook_need": "Pega al menos tu intro",
  "hook_retention": "Retención est.",
  "hook_score_label": "Puntuación del gancho",
  "hook_drops": "⚠️ Puntos de abandono",
  "hook_fixes": "✅ Correcciones",
  "hook_rewrite": "💡 Intro reescrita (mejor)",
  "nav_region": "Región",
  "audience_intro": "Elige tu objetivo (mundial, región o país) y el idioma: la IA da mejores horas, tendencias, hashtags y temas.",
  "audience_target": "Objetivo (país / región / mundial)",
  "audience_target_ph": "p. ej. Argelia, MENA, Francia, Mundial…",
  "audience_worldwide": "Mundial",
  "audience_niche": "Nicho / estilo del canal",
  "audience_niche_ph": "p. ej. Gaming, Cocina, Tech, Fútbol…",
  "audience_lang": "Idioma del contenido",
  "audience_run": "Optimizar para este público",
  "audience_times": "📅 Mejores horas para publicar",
  "audience_trends": "📈 Tendencias y formatos",
  "audience_hashtags": "🏷️ Hashtags localizados",
  "audience_topics": "💡 Ideas de temas",
  "audience_tips": "🎯 Consejos",
  "titles_section": "Títulos IA",
  "td_title": "Doctor de títulos",
  "td_run": "Diagnóstico IA profundo",
  "td_need": "Escribe un título primero",
  "td_len": "Longitud",
  "td_num": "Número",
  "td_emotion": "Palabra de impacto",
  "td_hook": "Gancho",
  "td_punct": "Puntuación",
  "td_ai_score": "Puntuación CTR",
  "td_missing": "⚠️ Qué falta",
  "td_improved": "💡 Título mejorado",
  "td_tips": "✅ Consejos",
  "tdh_len": "Ideal 40-70 caracteres: lo bastante descriptivo sin que YouTube lo corte.",
  "tdh_num": "Un número hace el título concreto (p. ej. 5 trucos, 2024) y llama la atención.",
  "tdh_emotion": "Una palabra de impacto (increíble, secreto, gratis, impactante…) provoca el clic.",
  "tdh_hook": "Un gancho al inicio (Cómo, Por qué, una pregunta…) crea curiosidad.",
  "tdh_punct": "Un ? o ! añade emoción y dan ganas de hacer clic.",
  "h_titledoctor": "Puntúa tu título en vivo y sugiere una versión optimizada para más clics.",
  "h_titles": "Genera 5 variantes de título optimizadas (SEO, CTR, viral, Shorts, tendencia).",
  "h_desc": "Crea una descripción completa con CTA de suscripción, hashtags y 15 etiquetas SEO.",
  "h_abtest": "Compara 2 títulos: la IA predice cuál obtiene más clics.",
  "h_thumbab": "Compara 2 miniaturas: la IA Vision dice cuál logra más clics y por qué.",
  "h_shorts": "Convierte el vídeo en 3 ideas de Shorts con los clips exactos para cortar.",
  "h_hook": "Analiza tu intro y predice la retención + dónde abandonan los espectadores.",
  "h_audience": "Mejores horas, tendencias, hashtags y temas para tu región y nicho.",
  "h_revenue": "Estima las vistas a 7 días y los ingresos de AdSense de tu vídeo.",
  "h_channel": "Estadísticas reales del canal + puntuación de salud y recomendaciones IA.",
  "h_comments": "Resume el sentimiento de los comentarios, las peticiones y sugiere respuestas.",
  "h_ideas": "Sugiere 10 ideas de vídeo de alto potencial adaptadas a tu nicho.",
  "desc_section": "Descripción completa",
  "desc_intro": "Título + nicho + región → descripción con CTA de suscripción, hashtags y etiquetas.",
  "desc_title": "Título del vídeo",
  "desc_title_ph": "El título de tu vídeo…",
  "desc_run": "Generar descripción completa",
  "desc_need": "Introduce un título primero",
  "desc_ready": "✅ Descripción lista para pegar",
  "desc_copy": "Copiar descripción",
  "desc_tags": "🏷️ Etiquetas SEO",
  "desc_copy_tags": "Copiar etiquetas",
  "chap_section": "Capítulos",
  "chap_intro": "Genera capítulos con marcas de tiempo (desde los subtítulos) para pegar en tu descripción.",
  "chap_run": "Generar capítulos",
  "chap_copy": "Copiar capítulos",
  "chap_none": "Subtítulos no disponibles para este vídeo.",
  "nav_revenue": "Ingresos",
  "rev_intro": "Estima las vistas a 7 días y los ingresos de AdSense según tu nicho, público y suscriptores.",
  "rev_subs": "Suscriptores de tu canal",
  "rev_subs_ph": "p. ej. 6m, 14k, 5000",
  "rev_run": "Estimar vistas e ingresos",
  "rev_views": "Vistas (D+7)",
  "rev_income": "Ingresos est.",
  "rev_factors": "📊 Factores clave",
  "rev_tips": "💡 Para aumentar",
  "rev_disclaimer": "Estimación basada en IA — los resultados reales pueden variar.",
  "nav_sponsor": "Patrocinio",
  "h_sponsor": "Estima tu tarifa de patrocinio, genera un pitch para marcas, un media kit e ideas de afiliación.",
  "sp_intro": "Estima tu valor de patrocinio y genera un pitch + media kit para conseguir acuerdos.",
  "sp_subs_ph": "Suscriptores (p. ej. 6m, 14k)",
  "sp_views_ph": "Vistas medias/vídeo (p. ej. 50k)",
  "sp_run": "Generar mi kit de patrocinio",
  "sp_rate": "Tarifa de patrocinio estimada (por vídeo)",
  "sp_pitch": "✉️ Mensaje de pitch para marcas",
  "sp_copy_pitch": "Copiar pitch",
  "sp_mediakit": "📋 Media kit (puntos de venta)",
  "sp_brands": "🏢 Marcas que encajarían",
  "sp_affiliate": "🔗 Ideas de afiliación",
  "sp_disclaimer": "Estimación IA — negocia según tu engagement real.",
  "nav_trends": "Tendencias",
  "h_trends": "Detecta lo que explota ahora en tu nicho (vídeos recientes reales) + análisis IA.",
  "tre_intro": "Lo que arrasa AHORA en tu nicho: vídeos que explotan + tendencias y palabras clave en alza.",
  "tre_run": "Detectar tendencias",
  "tre_need": "Elige un nicho primero",
  "tre_trends": "🔥 Tendencias actuales",
  "tre_keywords": "📈 Palabras clave en alza",
  "tre_advice": "💡 Cómo aprovecharlas",
  "tre_hot": "🚀 Vídeos que explotan (recientes)",
  "tre_none": "No se encontraron tendencias. Prueba un nicho más amplio.",
  "nav_planner": "Planificador",
  "h_planner": "Crea un calendario de 7 días adaptado a tu nicho para publicar con constancia.",
  "plan_intro": "Genera un plan de 7 días: qué publicar cada día + la mejor franja horaria.",
  "plan_freq": "Cadencia (opcional)",
  "plan_run": "Generar mi plan de 7 días",
  "tr_section": "Localización / Traducción",
  "h_translate": "Traduce y adapta tu título, descripción y etiquetas a otro idioma.",
  "tr_intro": "Traduce título + descripción + etiquetas a un idioma para llegar a un público global.",
  "tr_run": "Traducir",
  "tr_title": "Título traducido",
  "tr_desc": "Descripción traducida",
  "tr_copy": "Copiar traducción",
  "cp_section": "Publicaciones de comunidad",
  "h_community": "Genera encuestas, preguntas y teasers para la pestaña Comunidad.",
  "cp_intro": "Genera 5 publicaciones (encuestas, preguntas, teasers) para enganchar a tu público entre vídeos.",
  "cp_run": "Generar 5 publicaciones",
  "sc_section": "Guion completo",
  "h_script": "Escribe un guion estructurado (gancho, secciones, CTA) a partir de un tema.",
  "sc_intro": "Da un tema: la IA escribe el guion completo (gancho, intro, secciones, CTA, cierre).",
  "sc_topic_ph": "Tema del vídeo…",
  "sc_dur": "Duración",
  "sc_run": "Escribir el guion",
  "sc_need": "Introduce un tema primero",
  "sc_hook": "Gancho (primeros 5 s)",
  "sc_copy": "Copiar guion",
  "pc_section": "Comprobación título + miniatura",
  "h_pair": "Comprueba que tu título y miniatura se complementan y son legibles en TV y móvil.",
  "pc_intro": "La IA comprueba que tu título y miniatura se complementan (sin repetir) y su legibilidad.",
  "pc_run": "Comprobar el par",
  "pc_complement": "Complementarios",
  "pc_issues": "⚠️ Problemas",
  "pc_tips": "✅ Consejos",
  "pl_section": "Optimizador de playlists",
  "h_playlists": "Agrupa tus vídeos en playlists optimizadas para el tiempo de sesión.",
  "pl_intro": "La IA agrupa tus vídeos en playlists optimizadas (más tiempo de visualización).",
  "pl_run": "Optimizar mis playlists",
  "au_section": "Auditoría completa en 1 clic",
  "h_audit": "Ejecuta SEO + Miniatura + Título a la vez y da un plan de acción priorizado.",
  "au_run": "Ejecutar auditoría completa",
  "au_global": "Puntuación global del vídeo",
  "au_plan": "🎯 Plan de acción prioritario",
  "ob_title": "¡Bienvenido a VidSpark AI!",
  "ob_sub": "24 herramientas IA para optimizar tus vídeos. Esto es lo esencial:",
  "ob_audit": "una auditoría completa en 1 clic",
  "ob_title2": "puntuación CTR en vivo para tu título",
  "ob_thumb": "comparar 2 miniaturas",
  "ob_shorts": "ideas de Shorts + clips para cortar",
  "ob_sponsor": "estima tus ingresos de patrocinio",
  "ob_btn": "¡Vamos! 🚀",
  "nav_channel": "Canal",
  "chan_intro": "Panel del canal: estadísticas reales + puntuación de salud y recomendaciones IA.",
  "chan_run": "Analizar mi canal",
  "chan_subs": "Suscriptores",
  "chan_views": "Vistas totales",
  "chan_vids": "Vídeos",
  "chan_avg": "Vistas medias",
  "chan_eng": "Engagement",
  "chan_freq": "Frecuencia",
  "chan_ai_loading": "Diagnóstico IA en curso…",
  "chan_ai_fail": "Diagnóstico IA no disponible",
  "chan_health": "Puntuación de salud",
  "chan_strengths": "✅ Fortalezas",
  "chan_weak": "⚠️ Debilidades",
  "chan_reco": "💡 Recomendaciones",
  "nav_comments": "Comentarios",
  "com_intro": "La IA lee los comentarios: sentimiento, peticiones del público, ideas de vídeo y respuestas sugeridas.",
  "com_run": "Analizar comentarios",
  "com_none": "No se encontraron comentarios en este vídeo.",
  "com_loading": "💬 Leyendo y analizando comentarios…",
  "com_sentiment": "Sentimiento general",
  "com_pos": "Positivo",
  "com_neu": "Neutral",
  "com_neg": "Negativo",
  "com_requests": "🙋 Peticiones del público",
  "com_ideas": "💡 Ideas para el próximo vídeo",
  "com_replies": "✍️ Respuestas sugeridas",
  "com_copy": "Copiar",
  "nav_ideas": "Ideas",
  "idea_intro": "Elige tu nicho, región y un tema opcional: la IA sugiere 10 ideas de vídeo de alto potencial.",
  "idea_topic_ph": "Tema o palabra clave (opcional)…",
  "idea_run": "Generar 10 ideas",
  "idea_copy": "Copiar título",
  "kw_opportunity": "Puntuación de oportunidad",
  "kw_difficulty": "Dificultad",
  "kw_demand": "Demanda",
  "kw_trend": "Tendencia",
  "kw_best": "🎯 Palabras clave a las que apuntar",
  "kw_competition": "Competencia",
  "seo_tab_analyse": "📊 Análisis",
  "seo_tab_optim": "🎯 Optimización",
  "seo_tab_kw": "🔑 Palabras clave",
  "seo_tab_rec_kw": "Palabras clave recomendadas",
  "seo_tab_issues": "problemas",
  "seo_all_ok": "¡Todos los criterios validados!",
  "example_label": "Ejemplo:",
  "recommendation_label": "RECOMENDACIÓN:",
  "impact_pos_num": "Impacto positivo +8% CTR estimado",
  "impact_neg_num": "Añadir un número puede aumentar el CTR un 15–40%",
  "viral_pos_hook": "Gancho CTR al inicio del título",
  "viral_pos_num": "Número en el título",
  "viral_pos_em": "Palabra emocional presente",
  "viral_pos_desc": "Descripción lo bastante larga",
  "viral_pos_len": "Longitud de título óptima",
  "viral_neg_hook": "Sin gancho CTR — añade una pregunta o número al inicio",
  "viral_neg_num": "Sin número — los títulos con números logran +40% CTR",
  "viral_neg_em": "Sin palabra emocional — añade una palabra de impacto",
  "viral_neg_desc_tpl": "Descripción corta (N caracteres) — apunta a 500+",
  "viral_neg_len_short": "Título demasiado corto",
  "viral_neg_len_long": "Título demasiado largo",
  "viral_potential_title": "Puntuación de potencial viral",
  "btn_viral_ai": "✨ Análisis Viral IA"
 },
 "pt": {
  "nav_abtest": "Teste A/B",
  "abtest_intro": "Compare dois títulos: a IA prevê qual recebe mais cliques.",
  "abtest_a": "Título A",
  "abtest_b": "Título B",
  "abtest_run": "⚔️ Comparar títulos",
  "abtest_winner": "Vencedor",
  "abtest_verdict": "Veredito da IA",
  "abtest_improved": "💡 Título sugerido (ainda melhor)",
  "abtest_ctr": "CTR est.",
  "abtest_confidence": "Confiança",
  "abtest_use": "Usar este título",
  "thumbab_title": "Miniatura A/B",
  "thumbab_intro": "Compare 2 miniaturas: a IA Vision diz qual tem mais CTR e por quê.",
  "thumbab_a": "Miniatura A",
  "thumbab_b": "Miniatura B",
  "thumbab_run": "📸 Comparar miniaturas",
  "thumbab_tips": "💡 Para melhorar a vencedora",
  "thumbab_need2": "Escolha 2 imagens primeiro",
  "thumbab_prompt_label": "🎨 Prompt detalhado para criar a miniatura melhorada:",
  "thumbab_prompt_copy": "Copiar prompt",
  "thumbab_prompt_hint": "Cole este prompt numa IA de imagens (Midjourney, DALL·E, ChatGPT, Leonardo…) para gerar sua miniatura.",
  "nav_shorts": "Shorts",
  "shorts_intro": "Transforme este vídeo em ideias de Shorts virais (título, gancho, roteiro, hashtags).",
  "shorts_generate": "🎬 Gerar Shorts",
  "shorts_hook": "Gancho (primeiros 3 s)",
  "shorts_script": "Roteiro",
  "shorts_duration": "Duração",
  "shorts_copy": "Copiar roteiro",
  "shorts_summary": "Resumo",
  "shorts_clips": "✂️ Clipes para cortar",
  "shorts_estimated": "estimado",
  "shorts_real": "com base nas legendas",
  "live_stats_title": "Estatísticas reais do YouTube",
  "live_stats_btn": "Carregar dados reais (views/h, tags…)",
  "audit_title": "Auditoria do canal",
  "audit_btn": "Auditar este canal",
  "thumb_ai_title": "Análise de miniatura com IA",
  "thumb_ai_btn": "Analisar minha miniatura (IA)",
  "thumb_ideas_title": "Gerar conceitos de miniatura",
  "thumb_ideas_intro": "3 conceitos (texto, cores, layout, rosto) com base no seu título, prontos para executar.",
  "thumb_ideas_btn": "Gerar 3 conceitos",
  "thumb_ideas_loading": "Gerando conceitos…",
  "thumb_ideas_concept": "Conceito",
  "thumb_ideas_emotion": "Emoção",
  "thumb_ideas_text": "Texto",
  "thumb_ideas_focal": "Ponto focal",
  "thumb_ideas_face": "Rosto",
  "thumb_ideas_bg": "Fundo",
  "thumb_ideas_why": "Por quê",
  "thumb_ideas_copy": "Copiar resumo",
  "thumb_ideas_locked_sub": "Faça upgrade para Pro para desbloquear os 3 conceitos",
  "thumb_ideas_niche_ph": "Nicho (opcional, ex.: culinária, games)",
  "thumb_gen_btn": "🖼️ Gerar fundo",
  "thumb_gen_loading": "Gerando fundo…",
  "thumb_gen_overlay_note": "Fundo gerado por IA + seu texto sobreposto (a IA de imagens não escreve bem o texto, sobretudo em árabe).",
  "thumb_gen_text_ph": "Texto do título na imagem…",
  "thumb_gen_download": "Baixar imagem",
  "thumb_gen_downloaded": "Imagem baixada",
  "thumb_gen_drag_note": "2 linhas: digite seu texto, arraste cada linha, escolha cor/tamanho/fonte e baixe.",
  "thumb_gen_line": "Linha",
  "thumb_gen_color": "Cor",
  "thumb_gen_font": "Fonte",
  "thumb_gen_size": "Tamanho",
  "real_comp_title": "Concorrentes reais",
  "real_comp_btn": "Ver os vídeos reais que estão bombando",
  "keywords_title": "Pesquisa de palavras-chave",
  "keywords_ph": "ex.: receita de frango",
  "title_types": "Tipos de título",
  "result_label": "Resultado",
  "hook_title": "Analisador de ganchos",
  "hook_intro": "Cole o roteiro da sua intro (primeiros 15-30 s): a IA prevê a retenção e onde os espectadores saem.",
  "hook_ph": "Cole aqui o texto da sua intro…",
  "hook_run": "Analisar retenção",
  "hook_need": "Cole ao menos sua intro",
  "hook_retention": "Retenção est.",
  "hook_score_label": "Pontuação do gancho",
  "hook_drops": "⚠️ Pontos de abandono",
  "hook_fixes": "✅ Correções",
  "hook_rewrite": "💡 Intro reescrita (melhor)",
  "nav_region": "Região",
  "audience_intro": "Escolha seu alvo (mundial, região ou país) e o idioma: a IA dá melhores horários, tendências, hashtags e temas.",
  "audience_target": "Alvo (país / região / mundial)",
  "audience_target_ph": "ex.: Argélia, MENA, França, Mundial…",
  "audience_worldwide": "Mundial",
  "audience_niche": "Nicho / estilo do canal",
  "audience_niche_ph": "ex.: Games, Culinária, Tech, Futebol…",
  "audience_lang": "Idioma do conteúdo",
  "audience_run": "Otimizar para este público",
  "audience_times": "📅 Melhores horários para postar",
  "audience_trends": "📈 Tendências e formatos",
  "audience_hashtags": "🏷️ Hashtags localizadas",
  "audience_topics": "💡 Ideias de temas",
  "audience_tips": "🎯 Dicas",
  "titles_section": "Títulos IA",
  "td_title": "Doutor de títulos",
  "td_run": "Diagnóstico IA profundo",
  "td_need": "Digite um título primeiro",
  "td_len": "Comprimento",
  "td_num": "Número",
  "td_emotion": "Palavra de impacto",
  "td_hook": "Gancho",
  "td_punct": "Pontuação",
  "td_ai_score": "Pontuação CTR",
  "td_missing": "⚠️ O que falta",
  "td_improved": "💡 Título melhorado",
  "td_tips": "✅ Dicas",
  "tdh_len": "Ideal 40-70 caracteres: descritivo o bastante sem ser cortado pelo YouTube.",
  "tdh_num": "Um número deixa o título concreto (ex.: 5 dicas, 2024) e chama a atenção.",
  "tdh_emotion": "Uma palavra de impacto (incrível, segredo, grátis, chocante…) provoca o clique.",
  "tdh_hook": "Um gancho no início (Como, Por que, uma pergunta…) cria curiosidade.",
  "tdh_punct": "Um ? ou ! adiciona emoção e dá vontade de clicar.",
  "h_titledoctor": "Pontua seu título ao vivo e sugere uma versão otimizada para mais cliques.",
  "h_titles": "Gera 5 variações de título otimizadas (SEO, CTR, viral, Shorts, tendência).",
  "h_desc": "Cria uma descrição completa com CTA de inscrição, hashtags e 15 tags SEO.",
  "h_abtest": "Compara 2 títulos: a IA prevê qual recebe mais cliques.",
  "h_thumbab": "Compara 2 miniaturas: a IA Vision diz qual tem mais cliques e por quê.",
  "h_shorts": "Transforma o vídeo em 3 ideias de Shorts com os clipes exatos para cortar.",
  "h_hook": "Analisa sua intro e prevê a retenção + onde os espectadores saem.",
  "h_audience": "Melhores horários, tendências, hashtags e temas para sua região e nicho.",
  "h_revenue": "Estima as views em 7 dias e a receita do AdSense do seu vídeo.",
  "h_channel": "Estatísticas reais do canal + pontuação de saúde e recomendações IA.",
  "h_comments": "Resume o sentimento dos comentários, os pedidos e sugere respostas.",
  "h_ideas": "Sugere 10 ideias de vídeo de alto potencial adaptadas ao seu nicho.",
  "desc_section": "Descrição completa",
  "desc_intro": "Título + nicho + região → descrição com CTA de inscrição, hashtags e tags.",
  "desc_title": "Título do vídeo",
  "desc_title_ph": "O título do seu vídeo…",
  "desc_run": "Gerar descrição completa",
  "desc_need": "Digite um título primeiro",
  "desc_ready": "✅ Descrição pronta para colar",
  "desc_copy": "Copiar descrição",
  "desc_tags": "🏷️ Tags SEO",
  "desc_copy_tags": "Copiar tags",
  "chap_section": "Capítulos",
  "chap_intro": "Gere capítulos com marcações de tempo (a partir das legendas) para colar na descrição.",
  "chap_run": "Gerar capítulos",
  "chap_copy": "Copiar capítulos",
  "chap_none": "Legendas indisponíveis para este vídeo.",
  "nav_revenue": "Receita",
  "rev_intro": "Estime as views em 7 dias e a receita do AdSense com base no seu nicho, público e inscritos.",
  "rev_subs": "Inscritos do seu canal",
  "rev_subs_ph": "ex.: 6m, 14k, 5000",
  "rev_run": "Estimar views e receita",
  "rev_views": "Views (D+7)",
  "rev_income": "Receita est.",
  "rev_factors": "📊 Fatores-chave",
  "rev_tips": "💡 Para aumentar",
  "rev_disclaimer": "Estimativa baseada em IA — os resultados reais podem variar.",
  "nav_sponsor": "Patrocínio",
  "h_sponsor": "Estima sua tarifa de patrocínio, gera um pitch para marcas, um media kit e ideias de afiliação.",
  "sp_intro": "Estime seu valor de patrocínio e gere um pitch + media kit para fechar acordos.",
  "sp_subs_ph": "Inscritos (ex.: 6m, 14k)",
  "sp_views_ph": "Views médias/vídeo (ex.: 50k)",
  "sp_run": "Gerar meu kit de patrocínio",
  "sp_rate": "Tarifa de patrocínio estimada (por vídeo)",
  "sp_pitch": "✉️ Mensagem de pitch para marcas",
  "sp_copy_pitch": "Copiar pitch",
  "sp_mediakit": "📋 Media kit (pontos de venda)",
  "sp_brands": "🏢 Marcas que combinariam",
  "sp_affiliate": "🔗 Ideias de afiliação",
  "sp_disclaimer": "Estimativa IA — negocie com base no seu engajamento real.",
  "nav_trends": "Tendências",
  "h_trends": "Detecta o que está explodindo agora no seu nicho (vídeos recentes reais) + análise IA.",
  "tre_intro": "O que está bombando AGORA no seu nicho: vídeos explodindo + tendências e palavras-chave em alta.",
  "tre_run": "Detectar tendências",
  "tre_need": "Escolha um nicho primeiro",
  "tre_trends": "🔥 Tendências atuais",
  "tre_keywords": "📈 Palavras-chave em alta",
  "tre_advice": "💡 Como aproveitá-las",
  "tre_hot": "🚀 Vídeos explodindo (recentes)",
  "tre_none": "Nenhuma tendência encontrada. Tente um nicho mais amplo.",
  "nav_planner": "Planejador",
  "h_planner": "Cria um calendário de 7 dias adaptado ao seu nicho para postar com constância.",
  "plan_intro": "Gere um plano de 7 dias: o que postar a cada dia + o melhor horário.",
  "plan_freq": "Cadência (opcional)",
  "plan_run": "Gerar meu plano de 7 dias",
  "tr_section": "Localização / Tradução",
  "h_translate": "Traduz e adapta seu título, descrição e tags para outro idioma.",
  "tr_intro": "Traduza título + descrição + tags para um idioma e alcance um público global.",
  "tr_run": "Traduzir",
  "tr_title": "Título traduzido",
  "tr_desc": "Descrição traduzida",
  "tr_copy": "Copiar tradução",
  "cp_section": "Posts da comunidade",
  "h_community": "Gera enquetes, perguntas e teasers para a aba Comunidade.",
  "cp_intro": "Gere 5 posts (enquetes, perguntas, teasers) para engajar seu público entre vídeos.",
  "cp_run": "Gerar 5 posts",
  "sc_section": "Roteiro completo",
  "h_script": "Escreve um roteiro estruturado (gancho, seções, CTA) a partir de um tema.",
  "sc_intro": "Dê um tema: a IA escreve o roteiro completo (gancho, intro, seções, CTA, encerramento).",
  "sc_topic_ph": "Tema do vídeo…",
  "sc_dur": "Duração",
  "sc_run": "Escrever o roteiro",
  "sc_need": "Digite um tema primeiro",
  "sc_hook": "Gancho (primeiros 5 s)",
  "sc_copy": "Copiar roteiro",
  "pc_section": "Verificação título + miniatura",
  "h_pair": "Verifica se seu título e miniatura se complementam e são legíveis na TV e no celular.",
  "pc_intro": "A IA verifica se seu título e miniatura se complementam (sem repetir) e sua legibilidade.",
  "pc_run": "Verificar o par",
  "pc_complement": "Complementares",
  "pc_issues": "⚠️ Problemas",
  "pc_tips": "✅ Dicas",
  "pl_section": "Otimizador de playlists",
  "h_playlists": "Agrupa seus vídeos em playlists otimizadas para o tempo de sessão.",
  "pl_intro": "A IA agrupa seus vídeos em playlists otimizadas (mais tempo de exibição).",
  "pl_run": "Otimizar minhas playlists",
  "au_section": "Auditoria completa em 1 clique",
  "h_audit": "Executa SEO + Miniatura + Título de uma vez e dá um plano de ação priorizado.",
  "au_run": "Executar auditoria completa",
  "au_global": "Pontuação global do vídeo",
  "au_plan": "🎯 Plano de ação prioritário",
  "ob_title": "Bem-vindo ao VidSpark AI!",
  "ob_sub": "24 ferramentas IA para otimizar seus vídeos. Veja o essencial:",
  "ob_audit": "uma auditoria completa em 1 clique",
  "ob_title2": "pontuação CTR ao vivo para seu título",
  "ob_thumb": "comparar 2 miniaturas",
  "ob_shorts": "ideias de Shorts + clipes para cortar",
  "ob_sponsor": "estime sua receita de patrocínio",
  "ob_btn": "Vamos lá 🚀",
  "nav_channel": "Canal",
  "chan_intro": "Painel do canal: estatísticas reais + pontuação de saúde e recomendações IA.",
  "chan_run": "Analisar meu canal",
  "chan_subs": "Inscritos",
  "chan_views": "Views totais",
  "chan_vids": "Vídeos",
  "chan_avg": "Views médias",
  "chan_eng": "Engajamento",
  "chan_freq": "Frequência",
  "chan_ai_loading": "Diagnóstico IA em andamento…",
  "chan_ai_fail": "Diagnóstico IA indisponível",
  "chan_health": "Pontuação de saúde",
  "chan_strengths": "✅ Pontos fortes",
  "chan_weak": "⚠️ Pontos fracos",
  "chan_reco": "💡 Recomendações",
  "nav_comments": "Comentários",
  "com_intro": "A IA lê os comentários: sentimento, pedidos do público, ideias de vídeo e respostas sugeridas.",
  "com_run": "Analisar comentários",
  "com_none": "Nenhum comentário encontrado neste vídeo.",
  "com_loading": "💬 Lendo e analisando comentários…",
  "com_sentiment": "Sentimento geral",
  "com_pos": "Positivo",
  "com_neu": "Neutro",
  "com_neg": "Negativo",
  "com_requests": "🙋 Pedidos do público",
  "com_ideas": "💡 Ideias para o próximo vídeo",
  "com_replies": "✍️ Respostas sugeridas",
  "com_copy": "Copiar",
  "nav_ideas": "Ideias",
  "idea_intro": "Escolha seu nicho, região e um tema opcional: a IA sugere 10 ideias de vídeo de alto potencial.",
  "idea_topic_ph": "Tema ou palavra-chave (opcional)…",
  "idea_run": "Gerar 10 ideias",
  "idea_copy": "Copiar título",
  "kw_opportunity": "Pontuação de oportunidade",
  "kw_difficulty": "Dificuldade",
  "kw_demand": "Demanda",
  "kw_trend": "Tendência",
  "kw_best": "🎯 Palavras-chave para mirar",
  "kw_competition": "Concorrência",
  "seo_tab_analyse": "📊 Análise",
  "seo_tab_optim": "🎯 Otimização",
  "seo_tab_kw": "🔑 Palavras-chave",
  "seo_tab_rec_kw": "Palavras-chave recomendadas",
  "seo_tab_issues": "problemas",
  "seo_all_ok": "Todos os critérios validados!",
  "example_label": "Exemplo:",
  "recommendation_label": "RECOMENDAÇÃO:",
  "impact_pos_num": "Impacto positivo +8% de CTR estimado",
  "impact_neg_num": "Adicionar um número pode aumentar o CTR em 15–40%",
  "viral_pos_hook": "Gancho CTR no início do título",
  "viral_pos_num": "Número no título",
  "viral_pos_em": "Palavra emocional presente",
  "viral_pos_desc": "Descrição longa o bastante",
  "viral_pos_len": "Comprimento de título ótimo",
  "viral_neg_hook": "Sem gancho CTR — adicione uma pergunta ou número no início",
  "viral_neg_num": "Sem número — títulos com números têm +40% de CTR",
  "viral_neg_em": "Sem palavra emocional — adicione uma palavra de impacto",
  "viral_neg_desc_tpl": "Descrição curta (N caracteres) — mire em 500+",
  "viral_neg_len_short": "Título curto demais",
  "viral_neg_len_long": "Título longo demais",
  "viral_potential_title": "Pontuação de potencial viral",
  "btn_viral_ai": "✨ Análise Viral IA"
 },
 "de": {
  "nav_abtest": "A/B-Test",
  "abtest_intro": "Vergleiche zwei Titel: Die KI sagt voraus, welcher mehr Klicks erhält.",
  "abtest_a": "Titel A",
  "abtest_b": "Titel B",
  "abtest_run": "⚔️ Titel vergleichen",
  "abtest_winner": "Gewinner",
  "abtest_verdict": "KI-Urteil",
  "abtest_improved": "💡 Vorgeschlagener Titel (noch besser)",
  "abtest_ctr": "Gesch. CTR",
  "abtest_confidence": "Sicherheit",
  "abtest_use": "Diesen Titel verwenden",
  "thumbab_title": "Thumbnail A/B",
  "thumbab_intro": "Vergleiche 2 Thumbnails: Die Vision-KI sagt, welches mehr CTR bringt und warum.",
  "thumbab_a": "Thumbnail A",
  "thumbab_b": "Thumbnail B",
  "thumbab_run": "📸 Thumbnails vergleichen",
  "thumbab_tips": "💡 Um den Gewinner zu verbessern",
  "thumbab_need2": "Wähle zuerst 2 Bilder",
  "thumbab_prompt_label": "🎨 Detaillierter Prompt für das verbesserte Thumbnail:",
  "thumbab_prompt_copy": "Prompt kopieren",
  "thumbab_prompt_hint": "Füge diesen Prompt in eine Bild-KI ein (Midjourney, DALL·E, ChatGPT, Leonardo…), um dein Thumbnail zu erzeugen.",
  "nav_shorts": "Shorts",
  "shorts_intro": "Mach aus diesem Video virale Shorts-Ideen (Titel, Hook, Skript, Hashtags).",
  "shorts_generate": "🎬 Shorts generieren",
  "shorts_hook": "Hook (erste 3 Sek.)",
  "shorts_script": "Skript",
  "shorts_duration": "Dauer",
  "shorts_copy": "Skript kopieren",
  "shorts_summary": "Zusammenfassung",
  "shorts_clips": "✂️ Clips zum Schneiden",
  "shorts_estimated": "geschätzt",
  "shorts_real": "basierend auf Untertiteln",
  "live_stats_title": "Echte YouTube-Statistiken",
  "live_stats_btn": "Echte Daten laden (Views/Std., Tags…)",
  "audit_title": "Kanal-Audit",
  "audit_btn": "Diesen Kanal prüfen",
  "thumb_ai_title": "KI-Thumbnail-Analyse",
  "thumb_ai_btn": "Mein Thumbnail analysieren (KI)",
  "thumb_ideas_title": "Thumbnail-Konzepte generieren",
  "thumb_ideas_intro": "3 Konzepte (Text, Farben, Layout, Gesicht) basierend auf deinem Titel, sofort umsetzbar.",
  "thumb_ideas_btn": "3 Konzepte generieren",
  "thumb_ideas_loading": "Konzepte werden generiert…",
  "thumb_ideas_concept": "Konzept",
  "thumb_ideas_emotion": "Emotion",
  "thumb_ideas_text": "Text",
  "thumb_ideas_focal": "Fokuspunkt",
  "thumb_ideas_face": "Gesicht",
  "thumb_ideas_bg": "Hintergrund",
  "thumb_ideas_why": "Warum",
  "thumb_ideas_copy": "Briefing kopieren",
  "thumb_ideas_locked_sub": "Upgrade auf Pro, um alle 3 Konzepte freizuschalten",
  "thumb_ideas_niche_ph": "Nische (optional, z. B. Kochen, Gaming)",
  "thumb_gen_btn": "🖼️ Hintergrund generieren",
  "thumb_gen_loading": "Hintergrund wird generiert…",
  "thumb_gen_overlay_note": "KI-generierter Hintergrund + dein überlagerter Text (Bild-KI kann Text nicht gut schreiben, besonders Arabisch).",
  "thumb_gen_text_ph": "Titeltext auf dem Bild…",
  "thumb_gen_download": "Bild herunterladen",
  "thumb_gen_downloaded": "Bild heruntergeladen",
  "thumb_gen_drag_note": "2 Zeilen: Text eingeben, jede Zeile ziehen, Farbe/Größe/Schrift wählen, dann herunterladen.",
  "thumb_gen_line": "Zeile",
  "thumb_gen_color": "Farbe",
  "thumb_gen_font": "Schrift",
  "thumb_gen_size": "Größe",
  "real_comp_title": "Echte Konkurrenten",
  "real_comp_btn": "Die echten Top-Videos ansehen",
  "keywords_title": "Keyword-Recherche",
  "keywords_ph": "z. B. Hähnchen-Rezept",
  "title_types": "Titelarten",
  "result_label": "Ergebnis",
  "hook_title": "Hook-Analyse",
  "hook_intro": "Füge dein Intro-Skript ein (erste 15-30 Sek.): Die KI sagt die Bindung voraus und wo Zuschauer abspringen.",
  "hook_ph": "Füge hier deinen Intro-Text ein…",
  "hook_run": "Bindung analysieren",
  "hook_need": "Füge mindestens dein Intro ein",
  "hook_retention": "Gesch. Bindung",
  "hook_score_label": "Hook-Score",
  "hook_drops": "⚠️ Absprungstellen",
  "hook_fixes": "✅ Korrekturen",
  "hook_rewrite": "💡 Neu geschriebenes Intro (besser)",
  "nav_region": "Region",
  "audience_intro": "Wähle dein Ziel (weltweit, Region oder Land) und die Sprache: Die KI nennt beste Zeiten, Trends, Hashtags und Themen.",
  "audience_target": "Ziel (Land / Region / weltweit)",
  "audience_target_ph": "z. B. Algerien, MENA, Frankreich, Weltweit…",
  "audience_worldwide": "Weltweit",
  "audience_niche": "Nische / Kanalstil",
  "audience_niche_ph": "z. B. Gaming, Kochen, Tech, Fußball…",
  "audience_lang": "Inhaltssprache",
  "audience_run": "Für dieses Publikum optimieren",
  "audience_times": "📅 Beste Posting-Zeiten",
  "audience_trends": "📈 Trends & Formate",
  "audience_hashtags": "🏷️ Lokalisierte Hashtags",
  "audience_topics": "💡 Themenideen",
  "audience_tips": "🎯 Tipps",
  "titles_section": "KI-Titel",
  "td_title": "Titel-Doktor",
  "td_run": "Tiefe KI-Diagnose",
  "td_need": "Gib zuerst einen Titel ein",
  "td_len": "Länge",
  "td_num": "Zahl",
  "td_emotion": "Power-Wort",
  "td_hook": "Hook",
  "td_punct": "Satzzeichen",
  "td_ai_score": "CTR-Score",
  "td_missing": "⚠️ Was fehlt",
  "td_improved": "💡 Verbesserter Titel",
  "td_tips": "✅ Tipps",
  "tdh_len": "Ideal 40-70 Zeichen: beschreibend genug, ohne von YouTube abgeschnitten zu werden.",
  "tdh_num": "Eine Zahl macht den Titel konkret (z. B. 5 Tipps, 2024) und fällt auf.",
  "tdh_emotion": "Ein Power-Wort (unglaublich, Geheimnis, gratis, schockierend…) löst den Klick aus.",
  "tdh_hook": "Ein Hook am Anfang (Wie, Warum, eine Frage…) erzeugt Neugier.",
  "tdh_punct": "Ein ? oder ! fügt Emotion hinzu und macht Lust zu klicken.",
  "h_titledoctor": "Bewertet deinen Titel live und schlägt eine optimierte Version für mehr Klicks vor.",
  "h_titles": "Generiert 5 optimierte Titelvarianten (SEO, CTR, viral, Shorts, Trend).",
  "h_desc": "Erstellt eine vollständige Beschreibung mit Abo-CTA, Hashtags und 15 SEO-Tags.",
  "h_abtest": "Vergleicht 2 Titel: Die KI sagt voraus, welcher mehr Klicks erhält.",
  "h_thumbab": "Vergleicht 2 Thumbnails: Die Vision-KI sagt, welches mehr Klicks bringt und warum.",
  "h_shorts": "Macht aus dem Video 3 Shorts-Ideen mit den genauen Clips zum Schneiden.",
  "h_hook": "Analysiert dein Intro und sagt die Bindung voraus + wo Zuschauer abspringen.",
  "h_audience": "Beste Zeiten, Trends, Hashtags und Themen für deine Region und Nische.",
  "h_revenue": "Schätzt die 7-Tage-Views und die AdSense-Einnahmen deines Videos.",
  "h_channel": "Echte Kanalstatistiken + Gesundheits-Score und KI-Empfehlungen.",
  "h_comments": "Fasst die Stimmung der Kommentare und Wünsche zusammen und schlägt Antworten vor.",
  "h_ideas": "Schlägt 10 Video-Ideen mit hohem Potenzial für deine Nische vor.",
  "desc_section": "Vollständige Beschreibung",
  "desc_intro": "Titel + Nische + Region → Beschreibung mit Abo-CTA, Hashtags und Tags.",
  "desc_title": "Videotitel",
  "desc_title_ph": "Dein Videotitel…",
  "desc_run": "Vollständige Beschreibung generieren",
  "desc_need": "Gib zuerst einen Titel ein",
  "desc_ready": "✅ Fertige Beschreibung zum Einfügen",
  "desc_copy": "Beschreibung kopieren",
  "desc_tags": "🏷️ SEO-Tags",
  "desc_copy_tags": "Tags kopieren",
  "chap_section": "Kapitel",
  "chap_intro": "Generiere Kapitel mit Zeitstempeln (aus Untertiteln) zum Einfügen in deine Beschreibung.",
  "chap_run": "Kapitel generieren",
  "chap_copy": "Kapitel kopieren",
  "chap_none": "Untertitel für dieses Video nicht verfügbar.",
  "nav_revenue": "Einnahmen",
  "rev_intro": "Schätze die 7-Tage-Views und die AdSense-Einnahmen anhand von Nische, Publikum und Abonnenten.",
  "rev_subs": "Abonnenten deines Kanals",
  "rev_subs_ph": "z. B. 6m, 14k, 5000",
  "rev_run": "Views & Einnahmen schätzen",
  "rev_views": "Views (T+7)",
  "rev_income": "Gesch. Einnahmen",
  "rev_factors": "📊 Schlüsselfaktoren",
  "rev_tips": "💡 Zum Steigern",
  "rev_disclaimer": "KI-basierte Schätzung — die tatsächlichen Ergebnisse können abweichen.",
  "nav_sponsor": "Sponsoring",
  "h_sponsor": "Schätzt deinen Sponsoring-Preis, erstellt einen Marken-Pitch, ein Media-Kit und Affiliate-Ideen.",
  "sp_intro": "Schätze deinen Sponsoring-Wert und erstelle einen Pitch + Media-Kit, um Deals zu landen.",
  "sp_subs_ph": "Abonnenten (z. B. 6m, 14k)",
  "sp_views_ph": "Ø Views/Video (z. B. 50k)",
  "sp_run": "Mein Sponsoring-Kit erstellen",
  "sp_rate": "Geschätzter Sponsoring-Preis (pro Video)",
  "sp_pitch": "✉️ Marken-Pitch-Nachricht",
  "sp_copy_pitch": "Pitch kopieren",
  "sp_mediakit": "📋 Media-Kit (Verkaufsargumente)",
  "sp_brands": "🏢 Passende Marken",
  "sp_affiliate": "🔗 Affiliate-Ideen",
  "sp_disclaimer": "KI-Schätzung — verhandle auf Basis deines echten Engagements.",
  "nav_trends": "Trends",
  "h_trends": "Erkennt, was gerade in deiner Nische explodiert (echte aktuelle Videos) + KI-Analyse.",
  "tre_intro": "Was JETZT in deiner Nische angesagt ist: explodierende Videos + aufkommende Trends und Keywords.",
  "tre_run": "Trends erkennen",
  "tre_need": "Wähle zuerst eine Nische",
  "tre_trends": "🔥 Aktuelle Trends",
  "tre_keywords": "📈 Aufkommende Keywords",
  "tre_advice": "💡 Wie du sie nutzt",
  "tre_hot": "🚀 Explodierende Videos (aktuell)",
  "tre_none": "Keine Trends gefunden. Versuche eine breitere Nische.",
  "nav_planner": "Planer",
  "h_planner": "Erstellt einen 7-Tage-Kalender für deine Nische, um regelmäßig zu posten.",
  "plan_intro": "Generiere einen 7-Tage-Plan: was jeden Tag posten + das beste Zeitfenster.",
  "plan_freq": "Frequenz (optional)",
  "plan_run": "Meinen 7-Tage-Plan generieren",
  "tr_section": "Lokalisierung / Übersetzung",
  "h_translate": "Übersetzt und passt deinen Titel, Beschreibung und Tags in eine andere Sprache an.",
  "tr_intro": "Übersetze Titel + Beschreibung + Tags in eine Sprache, um ein globales Publikum zu erreichen.",
  "tr_run": "Übersetzen",
  "tr_title": "Übersetzter Titel",
  "tr_desc": "Übersetzte Beschreibung",
  "tr_copy": "Übersetzung kopieren",
  "cp_section": "Community-Beiträge",
  "h_community": "Generiert Umfragen, Fragen und Teaser für den Community-Tab.",
  "cp_intro": "Generiere 5 Beiträge (Umfragen, Fragen, Teaser), um dein Publikum zwischen Videos zu binden.",
  "cp_run": "5 Beiträge generieren",
  "sc_section": "Vollständiges Skript",
  "h_script": "Schreibt ein strukturiertes Skript (Hook, Abschnitte, CTA) aus einem Thema.",
  "sc_intro": "Gib ein Thema an: Die KI schreibt das ganze Skript (Hook, Intro, Abschnitte, CTA, Outro).",
  "sc_topic_ph": "Videothema…",
  "sc_dur": "Dauer",
  "sc_run": "Das Skript schreiben",
  "sc_need": "Gib zuerst ein Thema ein",
  "sc_hook": "Hook (erste 5 Sek.)",
  "sc_copy": "Skript kopieren",
  "pc_section": "Titel + Thumbnail prüfen",
  "h_pair": "Prüft, ob Titel und Thumbnail sich ergänzen und auf TV und Handy lesbar sind.",
  "pc_intro": "Die KI prüft, ob Titel und Thumbnail sich ergänzen (keine Wiederholung) und ihre Lesbarkeit.",
  "pc_run": "Das Paar prüfen",
  "pc_complement": "Ergänzend",
  "pc_issues": "⚠️ Probleme",
  "pc_tips": "✅ Tipps",
  "pl_section": "Playlist-Optimierer",
  "h_playlists": "Gruppiert deine Videos in optimierte Playlists für die Sitzungsdauer.",
  "pl_intro": "Die KI gruppiert deine Videos in optimierte Playlists (mehr Wiedergabezeit).",
  "pl_run": "Meine Playlists optimieren",
  "au_section": "Vollständiges Audit mit 1 Klick",
  "h_audit": "Führt SEO + Thumbnail + Titel auf einmal aus und liefert einen priorisierten Aktionsplan.",
  "au_run": "Vollständiges Audit ausführen",
  "au_global": "Gesamt-Score des Videos",
  "au_plan": "🎯 Prioritärer Aktionsplan",
  "ob_title": "Willkommen bei VidSpark AI!",
  "ob_sub": "24 KI-Tools, um deine Videos zu optimieren. Hier das Wichtigste:",
  "ob_audit": "ein vollständiges Audit mit 1 Klick",
  "ob_title2": "Live-CTR-Score für deinen Titel",
  "ob_thumb": "2 Thumbnails vergleichen",
  "ob_shorts": "Shorts-Ideen + Clips zum Schneiden",
  "ob_sponsor": "schätze deine Sponsoring-Einnahmen",
  "ob_btn": "Los geht's 🚀",
  "nav_channel": "Kanal",
  "chan_intro": "Kanal-Dashboard: echte Statistiken + Gesundheits-Score und KI-Empfehlungen.",
  "chan_run": "Meinen Kanal analysieren",
  "chan_subs": "Abonnenten",
  "chan_views": "Views gesamt",
  "chan_vids": "Videos",
  "chan_avg": "Ø Views",
  "chan_eng": "Engagement",
  "chan_freq": "Häufigkeit",
  "chan_ai_loading": "KI-Diagnose läuft…",
  "chan_ai_fail": "KI-Diagnose nicht verfügbar",
  "chan_health": "Gesundheits-Score",
  "chan_strengths": "✅ Stärken",
  "chan_weak": "⚠️ Schwächen",
  "chan_reco": "💡 Empfehlungen",
  "nav_comments": "Kommentare",
  "com_intro": "Die KI liest die Kommentare: Stimmung, Wünsche des Publikums, Video-Ideen und Antwortvorschläge.",
  "com_run": "Kommentare analysieren",
  "com_none": "Keine Kommentare zu diesem Video gefunden.",
  "com_loading": "💬 Kommentare werden gelesen und analysiert…",
  "com_sentiment": "Gesamtstimmung",
  "com_pos": "Positiv",
  "com_neu": "Neutral",
  "com_neg": "Negativ",
  "com_requests": "🙋 Wünsche des Publikums",
  "com_ideas": "💡 Ideen fürs nächste Video",
  "com_replies": "✍️ Antwortvorschläge",
  "com_copy": "Kopieren",
  "nav_ideas": "Ideen",
  "idea_intro": "Wähle Nische, Region und ein optionales Thema: Die KI schlägt 10 Video-Ideen mit hohem Potenzial vor.",
  "idea_topic_ph": "Thema oder Keyword (optional)…",
  "idea_run": "10 Ideen generieren",
  "idea_copy": "Titel kopieren",
  "kw_opportunity": "Chancen-Score",
  "kw_difficulty": "Schwierigkeit",
  "kw_demand": "Nachfrage",
  "kw_trend": "Trend",
  "kw_best": "🎯 Keywords zum Anvisieren",
  "kw_competition": "Konkurrenz",
  "seo_tab_analyse": "📊 Analyse",
  "seo_tab_optim": "🎯 Optimierung",
  "seo_tab_kw": "🔑 Keywords",
  "seo_tab_rec_kw": "Empfohlene Keywords",
  "seo_tab_issues": "Probleme",
  "seo_all_ok": "Alle Kriterien erfüllt!",
  "example_label": "Beispiel:",
  "recommendation_label": "EMPFEHLUNG:",
  "impact_pos_num": "Positiver Effekt +8% geschätzter CTR",
  "impact_neg_num": "Eine Zahl kann den CTR um 15–40% steigern",
  "viral_pos_hook": "CTR-Hook am Titelanfang",
  "viral_pos_num": "Zahl im Titel",
  "viral_pos_em": "Emotionales Wort vorhanden",
  "viral_pos_desc": "Beschreibung lang genug",
  "viral_pos_len": "Optimale Titellänge",
  "viral_neg_hook": "Kein CTR-Hook — füge am Anfang eine Frage oder Zahl hinzu",
  "viral_neg_num": "Keine Zahl — Titel mit Zahlen erzielen +40% CTR",
  "viral_neg_em": "Kein emotionales Wort — füge ein Power-Wort hinzu",
  "viral_neg_desc_tpl": "Kurze Beschreibung (N Zeichen) — strebe 500+ an",
  "viral_neg_len_short": "Titel zu kurz",
  "viral_neg_len_long": "Titel zu lang",
  "viral_potential_title": "Viral-Potenzial-Score",
  "btn_viral_ai": "✨ Virale KI-Analyse"
 },
 "it": {
  "nav_abtest": "Test A/B",
  "abtest_intro": "Confronta due titoli: l'IA prevede quale ottiene più clic.",
  "abtest_a": "Titolo A",
  "abtest_b": "Titolo B",
  "abtest_run": "⚔️ Confronta i titoli",
  "abtest_winner": "Vincitore",
  "abtest_verdict": "Verdetto IA",
  "abtest_improved": "💡 Titolo suggerito (ancora migliore)",
  "abtest_ctr": "CTR stim.",
  "abtest_confidence": "Affidabilità",
  "abtest_use": "Usa questo titolo",
  "thumbab_title": "Miniatura A/B",
  "thumbab_intro": "Confronta 2 miniature: l'IA Vision dice quale ottiene più CTR e perché.",
  "thumbab_a": "Miniatura A",
  "thumbab_b": "Miniatura B",
  "thumbab_run": "📸 Confronta le miniature",
  "thumbab_tips": "💡 Per migliorare la vincitrice",
  "thumbab_need2": "Scegli prima 2 immagini",
  "thumbab_prompt_label": "🎨 Prompt dettagliato per creare la miniatura migliorata:",
  "thumbab_prompt_copy": "Copia prompt",
  "thumbab_prompt_hint": "Incolla questo prompt in un'IA per immagini (Midjourney, DALL·E, ChatGPT, Leonardo…) per generare la tua miniatura.",
  "nav_shorts": "Shorts",
  "shorts_intro": "Trasforma questo video in idee per Shorts virali (titolo, hook, copione, hashtag).",
  "shorts_generate": "🎬 Genera Shorts",
  "shorts_hook": "Hook (primi 3 sec)",
  "shorts_script": "Copione",
  "shorts_duration": "Durata",
  "shorts_copy": "Copia copione",
  "shorts_summary": "Riassunto",
  "shorts_clips": "✂️ Clip da tagliare",
  "shorts_estimated": "stimato",
  "shorts_real": "basato sui sottotitoli",
  "live_stats_title": "Statistiche reali di YouTube",
  "live_stats_btn": "Carica dati reali (visual./h, tag…)",
  "audit_title": "Audit del canale",
  "audit_btn": "Esamina questo canale",
  "thumb_ai_title": "Analisi miniatura con IA",
  "thumb_ai_btn": "Analizza la mia miniatura (IA)",
  "thumb_ideas_title": "Genera concept di miniatura",
  "thumb_ideas_intro": "3 concept (testo, colori, layout, volto) basati sul tuo titolo, pronti da realizzare.",
  "thumb_ideas_btn": "Genera 3 concept",
  "thumb_ideas_loading": "Generazione dei concept…",
  "thumb_ideas_concept": "Concept",
  "thumb_ideas_emotion": "Emozione",
  "thumb_ideas_text": "Testo",
  "thumb_ideas_focal": "Punto focale",
  "thumb_ideas_face": "Volto",
  "thumb_ideas_bg": "Sfondo",
  "thumb_ideas_why": "Perché",
  "thumb_ideas_copy": "Copia il brief",
  "thumb_ideas_locked_sub": "Passa a Pro per sbloccare tutti e 3 i concept",
  "thumb_ideas_niche_ph": "Nicchia (facoltativo, es. cucina, gaming)",
  "thumb_gen_btn": "🖼️ Genera sfondo",
  "thumb_gen_loading": "Generazione dello sfondo…",
  "thumb_gen_overlay_note": "Sfondo generato dall'IA + il tuo testo sovrapposto (l'IA per immagini non scrive bene il testo, soprattutto in arabo).",
  "thumb_gen_text_ph": "Testo del titolo sull'immagine…",
  "thumb_gen_download": "Scarica immagine",
  "thumb_gen_downloaded": "Immagine scaricata",
  "thumb_gen_drag_note": "2 righe: scrivi il testo, trascina ogni riga, scegli colore/dimensione/font, poi scarica.",
  "thumb_gen_line": "Riga",
  "thumb_gen_color": "Colore",
  "thumb_gen_font": "Font",
  "thumb_gen_size": "Dimensione",
  "real_comp_title": "Concorrenti reali",
  "real_comp_btn": "Vedi i video reali che spaccano",
  "keywords_title": "Ricerca parole chiave",
  "keywords_ph": "es. ricetta di pollo",
  "title_types": "Tipi di titolo",
  "result_label": "Risultato",
  "hook_title": "Analizzatore di hook",
  "hook_intro": "Incolla il copione dell'intro (primi 15-30 sec): l'IA prevede la retention e dove gli spettatori abbandonano.",
  "hook_ph": "Incolla qui il testo della tua intro…",
  "hook_run": "Analizza la retention",
  "hook_need": "Incolla almeno la tua intro",
  "hook_retention": "Retention stim.",
  "hook_score_label": "Punteggio hook",
  "hook_drops": "⚠️ Punti di abbandono",
  "hook_fixes": "✅ Correzioni",
  "hook_rewrite": "💡 Intro riscritta (migliore)",
  "nav_region": "Regione",
  "audience_intro": "Scegli il tuo target (mondiale, regione o paese) e la lingua: l'IA dà orari migliori, trend, hashtag e argomenti.",
  "audience_target": "Target (paese / regione / mondiale)",
  "audience_target_ph": "es. Algeria, MENA, Francia, Mondiale…",
  "audience_worldwide": "Mondiale",
  "audience_niche": "Nicchia / stile del canale",
  "audience_niche_ph": "es. Gaming, Cucina, Tech, Calcio…",
  "audience_lang": "Lingua dei contenuti",
  "audience_run": "Ottimizza per questo pubblico",
  "audience_times": "📅 Orari migliori per pubblicare",
  "audience_trends": "📈 Trend e formati",
  "audience_hashtags": "🏷️ Hashtag localizzati",
  "audience_topics": "💡 Idee di argomenti",
  "audience_tips": "🎯 Consigli",
  "titles_section": "Titoli IA",
  "td_title": "Dottore dei titoli",
  "td_run": "Diagnosi IA approfondita",
  "td_need": "Scrivi prima un titolo",
  "td_len": "Lunghezza",
  "td_num": "Numero",
  "td_emotion": "Parola d'impatto",
  "td_hook": "Hook",
  "td_punct": "Punteggiatura",
  "td_ai_score": "Punteggio CTR",
  "td_missing": "⚠️ Cosa manca",
  "td_improved": "💡 Titolo migliorato",
  "td_tips": "✅ Consigli",
  "tdh_len": "Ideale 40-70 caratteri: abbastanza descrittivo senza essere tagliato da YouTube.",
  "tdh_num": "Un numero rende il titolo concreto (es. 5 consigli, 2024) e attira l'occhio.",
  "tdh_emotion": "Una parola d'impatto (incredibile, segreto, gratis, scioccante…) spinge al clic.",
  "tdh_hook": "Un hook all'inizio (Come, Perché, una domanda…) crea curiosità.",
  "tdh_punct": "Un ? o ! aggiunge emozione e fa venire voglia di cliccare.",
  "h_titledoctor": "Valuta il tuo titolo in tempo reale e suggerisce una versione ottimizzata per più clic.",
  "h_titles": "Genera 5 varianti di titolo ottimizzate (SEO, CTR, virale, Shorts, trend).",
  "h_desc": "Crea una descrizione completa con CTA di iscrizione, hashtag e 15 tag SEO.",
  "h_abtest": "Confronta 2 titoli: l'IA prevede quale ottiene più clic.",
  "h_thumbab": "Confronta 2 miniature: l'IA Vision dice quale ottiene più clic e perché.",
  "h_shorts": "Trasforma il video in 3 idee per Shorts con le clip esatte da tagliare.",
  "h_hook": "Analizza la tua intro e prevede la retention + dove gli spettatori abbandonano.",
  "h_audience": "Orari migliori, trend, hashtag e argomenti per la tua regione e nicchia.",
  "h_revenue": "Stima le visualizzazioni a 7 giorni e i ricavi AdSense del tuo video.",
  "h_channel": "Statistiche reali del canale + punteggio di salute e raccomandazioni IA.",
  "h_comments": "Riassume il sentiment dei commenti, le richieste e suggerisce risposte.",
  "h_ideas": "Suggerisce 10 idee video ad alto potenziale per la tua nicchia.",
  "desc_section": "Descrizione completa",
  "desc_intro": "Titolo + nicchia + regione → descrizione con CTA di iscrizione, hashtag e tag.",
  "desc_title": "Titolo del video",
  "desc_title_ph": "Il titolo del tuo video…",
  "desc_run": "Genera descrizione completa",
  "desc_need": "Inserisci prima un titolo",
  "desc_ready": "✅ Descrizione pronta da incollare",
  "desc_copy": "Copia descrizione",
  "desc_tags": "🏷️ Tag SEO",
  "desc_copy_tags": "Copia tag",
  "chap_section": "Capitoli",
  "chap_intro": "Genera capitoli con timestamp (dai sottotitoli) da incollare nella descrizione.",
  "chap_run": "Genera capitoli",
  "chap_copy": "Copia capitoli",
  "chap_none": "Sottotitoli non disponibili per questo video.",
  "nav_revenue": "Ricavi",
  "rev_intro": "Stima le visualizzazioni a 7 giorni e i ricavi AdSense in base a nicchia, pubblico e iscritti.",
  "rev_subs": "Iscritti del tuo canale",
  "rev_subs_ph": "es. 6m, 14k, 5000",
  "rev_run": "Stima visualizzazioni e ricavi",
  "rev_views": "Visualizzazioni (G+7)",
  "rev_income": "Ricavi stim.",
  "rev_factors": "📊 Fattori chiave",
  "rev_tips": "💡 Per aumentare",
  "rev_disclaimer": "Stima basata su IA — i risultati reali possono variare.",
  "nav_sponsor": "Sponsor",
  "h_sponsor": "Stima la tua tariffa sponsor, genera un pitch per i brand, un media kit e idee di affiliazione.",
  "sp_intro": "Stima il tuo valore sponsor e genera un pitch + media kit per chiudere accordi.",
  "sp_subs_ph": "Iscritti (es. 6m, 14k)",
  "sp_views_ph": "Visual. medie/video (es. 50k)",
  "sp_run": "Genera il mio kit sponsor",
  "sp_rate": "Tariffa sponsor stimata (per video)",
  "sp_pitch": "✉️ Messaggio pitch per i brand",
  "sp_copy_pitch": "Copia pitch",
  "sp_mediakit": "📋 Media kit (punti di forza)",
  "sp_brands": "🏢 Brand adatti",
  "sp_affiliate": "🔗 Idee di affiliazione",
  "sp_disclaimer": "Stima IA — negozia in base al tuo engagement reale.",
  "nav_trends": "Trend",
  "h_trends": "Rileva cosa sta esplodendo ora nella tua nicchia (video recenti reali) + analisi IA.",
  "tre_intro": "Cosa spopola ORA nella tua nicchia: video che esplodono + trend e parole chiave in crescita.",
  "tre_run": "Rileva i trend",
  "tre_need": "Scegli prima una nicchia",
  "tre_trends": "🔥 Trend attuali",
  "tre_keywords": "📈 Parole chiave in crescita",
  "tre_advice": "💡 Come sfruttarli",
  "tre_hot": "🚀 Video che esplodono (recenti)",
  "tre_none": "Nessun trend trovato. Prova una nicchia più ampia.",
  "nav_planner": "Planner",
  "h_planner": "Crea un calendario di 7 giorni su misura per la tua nicchia per pubblicare con costanza.",
  "plan_intro": "Genera un piano di 7 giorni: cosa pubblicare ogni giorno + la fascia oraria migliore.",
  "plan_freq": "Cadenza (facoltativo)",
  "plan_run": "Genera il mio piano di 7 giorni",
  "tr_section": "Localizzazione / Traduzione",
  "h_translate": "Traduce e adatta il tuo titolo, descrizione e tag in un'altra lingua.",
  "tr_intro": "Traduci titolo + descrizione + tag in una lingua per raggiungere un pubblico globale.",
  "tr_run": "Traduci",
  "tr_title": "Titolo tradotto",
  "tr_desc": "Descrizione tradotta",
  "tr_copy": "Copia traduzione",
  "cp_section": "Post della community",
  "h_community": "Genera sondaggi, domande e teaser per la scheda Community.",
  "cp_intro": "Genera 5 post (sondaggi, domande, teaser) per coinvolgere il pubblico tra un video e l'altro.",
  "cp_run": "Genera 5 post",
  "sc_section": "Copione completo",
  "h_script": "Scrive un copione strutturato (hook, sezioni, CTA) a partire da un argomento.",
  "sc_intro": "Dai un argomento: l'IA scrive il copione completo (hook, intro, sezioni, CTA, chiusura).",
  "sc_topic_ph": "Argomento del video…",
  "sc_dur": "Durata",
  "sc_run": "Scrivi il copione",
  "sc_need": "Inserisci prima un argomento",
  "sc_hook": "Hook (primi 5 sec)",
  "sc_copy": "Copia copione",
  "pc_section": "Controllo titolo + miniatura",
  "h_pair": "Verifica che titolo e miniatura si completino e siano leggibili su TV e mobile.",
  "pc_intro": "L'IA verifica che titolo e miniatura si completino (senza ripetersi) e la loro leggibilità.",
  "pc_run": "Controlla la coppia",
  "pc_complement": "Complementari",
  "pc_issues": "⚠️ Problemi",
  "pc_tips": "✅ Consigli",
  "pl_section": "Ottimizzatore di playlist",
  "h_playlists": "Raggruppa i tuoi video in playlist ottimizzate per il tempo di sessione.",
  "pl_intro": "L'IA raggruppa i tuoi video in playlist ottimizzate (più tempo di visione).",
  "pl_run": "Ottimizza le mie playlist",
  "au_section": "Audit completo in 1 clic",
  "h_audit": "Esegue SEO + Miniatura + Titolo in una volta e dà un piano d'azione prioritario.",
  "au_run": "Esegui l'audit completo",
  "au_global": "Punteggio globale del video",
  "au_plan": "🎯 Piano d'azione prioritario",
  "ob_title": "Benvenuto in VidSpark AI!",
  "ob_sub": "24 strumenti IA per ottimizzare i tuoi video. Ecco l'essenziale:",
  "ob_audit": "un audit completo in 1 clic",
  "ob_title2": "punteggio CTR in tempo reale per il tuo titolo",
  "ob_thumb": "confronta 2 miniature",
  "ob_shorts": "idee per Shorts + clip da tagliare",
  "ob_sponsor": "stima i tuoi ricavi da sponsor",
  "ob_btn": "Iniziamo 🚀",
  "nav_channel": "Canale",
  "chan_intro": "Dashboard del canale: statistiche reali + punteggio di salute e raccomandazioni IA.",
  "chan_run": "Analizza il mio canale",
  "chan_subs": "Iscritti",
  "chan_views": "Visualizzazioni totali",
  "chan_vids": "Video",
  "chan_avg": "Visual. medie",
  "chan_eng": "Engagement",
  "chan_freq": "Frequenza",
  "chan_ai_loading": "Diagnosi IA in corso…",
  "chan_ai_fail": "Diagnosi IA non disponibile",
  "chan_health": "Punteggio di salute",
  "chan_strengths": "✅ Punti di forza",
  "chan_weak": "⚠️ Punti deboli",
  "chan_reco": "💡 Raccomandazioni",
  "nav_comments": "Commenti",
  "com_intro": "L'IA legge i commenti: sentiment, richieste del pubblico, idee video e risposte suggerite.",
  "com_run": "Analizza i commenti",
  "com_none": "Nessun commento trovato su questo video.",
  "com_loading": "💬 Lettura e analisi dei commenti…",
  "com_sentiment": "Sentiment generale",
  "com_pos": "Positivo",
  "com_neu": "Neutro",
  "com_neg": "Negativo",
  "com_requests": "🙋 Richieste del pubblico",
  "com_ideas": "💡 Idee per il prossimo video",
  "com_replies": "✍️ Risposte suggerite",
  "com_copy": "Copia",
  "nav_ideas": "Idee",
  "idea_intro": "Scegli nicchia, regione e un argomento facoltativo: l'IA suggerisce 10 idee video ad alto potenziale.",
  "idea_topic_ph": "Argomento o parola chiave (facoltativo)…",
  "idea_run": "Genera 10 idee",
  "idea_copy": "Copia titolo",
  "kw_opportunity": "Punteggio di opportunità",
  "kw_difficulty": "Difficoltà",
  "kw_demand": "Domanda",
  "kw_trend": "Trend",
  "kw_best": "🎯 Parole chiave da puntare",
  "kw_competition": "Concorrenza",
  "seo_tab_analyse": "📊 Analisi",
  "seo_tab_optim": "🎯 Ottimizzazione",
  "seo_tab_kw": "🔑 Parole chiave",
  "seo_tab_rec_kw": "Parole chiave consigliate",
  "seo_tab_issues": "problemi",
  "seo_all_ok": "Tutti i criteri soddisfatti!",
  "example_label": "Esempio:",
  "recommendation_label": "RACCOMANDAZIONE:",
  "impact_pos_num": "Impatto positivo +8% CTR stimato",
  "impact_neg_num": "Aggiungere un numero può aumentare il CTR del 15–40%",
  "viral_pos_hook": "Hook CTR all'inizio del titolo",
  "viral_pos_num": "Numero nel titolo",
  "viral_pos_em": "Parola emozionale presente",
  "viral_pos_desc": "Descrizione abbastanza lunga",
  "viral_pos_len": "Lunghezza del titolo ottimale",
  "viral_neg_hook": "Nessun hook CTR — aggiungi una domanda o un numero all'inizio",
  "viral_neg_num": "Nessun numero — i titoli con numeri ottengono +40% di CTR",
  "viral_neg_em": "Nessuna parola emozionale — aggiungi una parola d'impatto",
  "viral_neg_desc_tpl": "Descrizione corta (N caratteri) — punta a 500+",
  "viral_neg_len_short": "Titolo troppo corto",
  "viral_neg_len_long": "Titolo troppo lungo",
  "viral_potential_title": "Punteggio di potenziale virale",
  "btn_viral_ai": "✨ Analisi Virale IA"
 },
 "ru": {
  "nav_abtest": "A/B-тест",
  "abtest_intro": "Сравните два заголовка: ИИ предскажет, какой получит больше кликов.",
  "abtest_a": "Заголовок A",
  "abtest_b": "Заголовок B",
  "abtest_run": "⚔️ Сравнить заголовки",
  "abtest_winner": "Победитель",
  "abtest_verdict": "Вердикт ИИ",
  "abtest_improved": "💡 Предложенный заголовок (ещё лучше)",
  "abtest_ctr": "Прим. CTR",
  "abtest_confidence": "Уверенность",
  "abtest_use": "Использовать этот заголовок",
  "thumbab_title": "Превью A/B",
  "thumbab_intro": "Сравните 2 превью: Vision ИИ скажет, какое даёт больше CTR и почему.",
  "thumbab_a": "Превью A",
  "thumbab_b": "Превью B",
  "thumbab_run": "📸 Сравнить превью",
  "thumbab_tips": "💡 Чтобы улучшить победителя",
  "thumbab_need2": "Сначала выберите 2 изображения",
  "thumbab_prompt_label": "🎨 Подробный промпт для создания улучшенного превью:",
  "thumbab_prompt_copy": "Копировать промпт",
  "thumbab_prompt_hint": "Вставьте этот промпт в ИИ для изображений (Midjourney, DALL·E, ChatGPT, Leonardo…), чтобы создать превью.",
  "nav_shorts": "Shorts",
  "shorts_intro": "Превратите это видео в идеи вирусных Shorts (заголовок, хук, сценарий, хэштеги).",
  "shorts_generate": "🎬 Создать Shorts",
  "shorts_hook": "Хук (первые 3 сек)",
  "shorts_script": "Сценарий",
  "shorts_duration": "Длительность",
  "shorts_copy": "Копировать сценарий",
  "shorts_summary": "Кратко",
  "shorts_clips": "✂️ Клипы для нарезки",
  "shorts_estimated": "примерно",
  "shorts_real": "по субтитрам",
  "live_stats_title": "Реальная статистика YouTube",
  "live_stats_btn": "Загрузить реальные данные (просм./ч, теги…)",
  "audit_title": "Аудит канала",
  "audit_btn": "Проверить этот канал",
  "thumb_ai_title": "ИИ-анализ превью",
  "thumb_ai_btn": "Анализировать моё превью (ИИ)",
  "thumb_ideas_title": "Создать концепты превью",
  "thumb_ideas_intro": "3 концепта (текст, цвета, макет, лицо) на основе вашего заголовка, готовые к воплощению.",
  "thumb_ideas_btn": "Создать 3 концепта",
  "thumb_ideas_loading": "Создание концептов…",
  "thumb_ideas_concept": "Концепт",
  "thumb_ideas_emotion": "Эмоция",
  "thumb_ideas_text": "Текст",
  "thumb_ideas_focal": "Фокус",
  "thumb_ideas_face": "Лицо",
  "thumb_ideas_bg": "Фон",
  "thumb_ideas_why": "Почему",
  "thumb_ideas_copy": "Копировать бриф",
  "thumb_ideas_locked_sub": "Перейдите на Pro, чтобы открыть все 3 концепта",
  "thumb_ideas_niche_ph": "Ниша (необязательно, напр. кулинария, игры)",
  "thumb_gen_btn": "🖼️ Создать фон",
  "thumb_gen_loading": "Создание фона…",
  "thumb_gen_overlay_note": "Фон, созданный ИИ, + ваш наложенный текст (ИИ для изображений плохо пишет текст, особенно на арабском).",
  "thumb_gen_text_ph": "Текст заголовка на изображении…",
  "thumb_gen_download": "Скачать изображение",
  "thumb_gen_downloaded": "Изображение скачано",
  "thumb_gen_drag_note": "2 строки: введите текст, перетащите каждую строку, выберите цвет/размер/шрифт, затем скачайте.",
  "thumb_gen_line": "Строка",
  "thumb_gen_color": "Цвет",
  "thumb_gen_font": "Шрифт",
  "thumb_gen_size": "Размер",
  "real_comp_title": "Реальные конкуренты",
  "real_comp_btn": "Смотреть реальные видео в топе",
  "keywords_title": "Поиск ключевых слов",
  "keywords_ph": "напр. рецепт курицы",
  "title_types": "Типы заголовков",
  "result_label": "Результат",
  "hook_title": "Анализатор хука",
  "hook_intro": "Вставьте сценарий интро (первые 15-30 сек): ИИ предскажет удержание и где зрители уходят.",
  "hook_ph": "Вставьте сюда текст интро…",
  "hook_run": "Анализировать удержание",
  "hook_need": "Вставьте хотя бы интро",
  "hook_retention": "Прим. удержание",
  "hook_score_label": "Оценка хука",
  "hook_drops": "⚠️ Точки оттока",
  "hook_fixes": "✅ Исправления",
  "hook_rewrite": "💡 Переписанное интро (лучше)",
  "nav_region": "Регион",
  "audience_intro": "Выберите цель (весь мир, регион или страна) и язык: ИИ подскажет лучшее время, тренды, хэштеги и темы.",
  "audience_target": "Цель (страна / регион / весь мир)",
  "audience_target_ph": "напр. Алжир, MENA, Франция, Весь мир…",
  "audience_worldwide": "Весь мир",
  "audience_niche": "Ниша / стиль канала",
  "audience_niche_ph": "напр. Игры, Кулинария, Тех, Футбол…",
  "audience_lang": "Язык контента",
  "audience_run": "Оптимизировать под эту аудиторию",
  "audience_times": "📅 Лучшее время для публикации",
  "audience_trends": "📈 Тренды и форматы",
  "audience_hashtags": "🏷️ Локальные хэштеги",
  "audience_topics": "💡 Идеи тем",
  "audience_tips": "🎯 Советы",
  "titles_section": "ИИ-заголовки",
  "td_title": "Доктор заголовков",
  "td_run": "Глубокая ИИ-диагностика",
  "td_need": "Сначала введите заголовок",
  "td_len": "Длина",
  "td_num": "Число",
  "td_emotion": "Сильное слово",
  "td_hook": "Хук",
  "td_punct": "Пунктуация",
  "td_ai_score": "Оценка CTR",
  "td_missing": "⚠️ Чего не хватает",
  "td_improved": "💡 Улучшенный заголовок",
  "td_tips": "✅ Советы",
  "tdh_len": "Идеально 40-70 символов: достаточно описательно, без обрезки YouTube.",
  "tdh_num": "Число делает заголовок конкретным (напр. 5 советов, 2024) и привлекает взгляд.",
  "tdh_emotion": "Сильное слово (невероятный, секрет, бесплатно, шокирующий…) вызывает клик.",
  "tdh_hook": "Хук в начале (Как, Почему, вопрос…) создаёт любопытство.",
  "tdh_punct": "Знак ? или ! добавляет эмоций и желание кликнуть.",
  "h_titledoctor": "Оценивает ваш заголовок в реальном времени и предлагает оптимизированную версию для большего числа кликов.",
  "h_titles": "Генерирует 5 оптимизированных вариантов заголовка (SEO, CTR, вирусный, Shorts, трендовый).",
  "h_desc": "Создаёт полное описание с призывом подписаться, хэштегами и 15 SEO-тегами.",
  "h_abtest": "Сравнивает 2 заголовка: ИИ предсказывает, какой получит больше кликов.",
  "h_thumbab": "Сравнивает 2 превью: Vision ИИ скажет, какое даёт больше кликов и почему.",
  "h_shorts": "Превращает видео в 3 идеи Shorts с точными клипами для нарезки.",
  "h_hook": "Анализирует ваше интро и предсказывает удержание + где зрители уходят.",
  "h_audience": "Лучшее время, тренды, хэштеги и темы для вашего региона и ниши.",
  "h_revenue": "Оценивает просмотры за 7 дней и доход AdSense вашего видео.",
  "h_channel": "Реальная статистика канала + оценка здоровья и ИИ-рекомендации.",
  "h_comments": "Резюмирует тональность комментариев, запросы и предлагает ответы.",
  "h_ideas": "Предлагает 10 перспективных идей видео под вашу нишу.",
  "desc_section": "Полное описание",
  "desc_intro": "Заголовок + ниша + регион → описание с призывом подписаться, хэштегами и тегами.",
  "desc_title": "Заголовок видео",
  "desc_title_ph": "Заголовок вашего видео…",
  "desc_run": "Создать полное описание",
  "desc_need": "Сначала введите заголовок",
  "desc_ready": "✅ Описание готово к вставке",
  "desc_copy": "Копировать описание",
  "desc_tags": "🏷️ SEO-теги",
  "desc_copy_tags": "Копировать теги",
  "chap_section": "Главы",
  "chap_intro": "Создайте главы с таймкодами (из субтитров) для вставки в описание.",
  "chap_run": "Создать главы",
  "chap_copy": "Копировать главы",
  "chap_none": "Субтитры для этого видео недоступны.",
  "nav_revenue": "Доход",
  "rev_intro": "Оцените просмотры за 7 дней и доход AdSense на основе ниши, аудитории и подписчиков.",
  "rev_subs": "Подписчики вашего канала",
  "rev_subs_ph": "напр. 6m, 14k, 5000",
  "rev_run": "Оценить просмотры и доход",
  "rev_views": "Просмотры (Д+7)",
  "rev_income": "Прим. доход",
  "rev_factors": "📊 Ключевые факторы",
  "rev_tips": "💡 Чтобы увеличить",
  "rev_disclaimer": "Оценка на основе ИИ — реальные результаты могут отличаться.",
  "nav_sponsor": "Спонсор",
  "h_sponsor": "Оценивает вашу ставку за спонсорство, создаёт питч для брендов, медиакит и идеи для партнёрки.",
  "sp_intro": "Оцените свою спонсорскую ценность и создайте питч + медиакит, чтобы заключать сделки.",
  "sp_subs_ph": "Подписчики (напр. 6m, 14k)",
  "sp_views_ph": "Ср. просмотры/видео (напр. 50k)",
  "sp_run": "Создать мой спонсорский кит",
  "sp_rate": "Оценочная ставка за спонсорство (за видео)",
  "sp_pitch": "✉️ Питч-сообщение для брендов",
  "sp_copy_pitch": "Копировать питч",
  "sp_mediakit": "📋 Медиакит (преимущества)",
  "sp_brands": "🏢 Подходящие бренды",
  "sp_affiliate": "🔗 Идеи для партнёрки",
  "sp_disclaimer": "Оценка ИИ — договаривайтесь исходя из реальной вовлечённости.",
  "nav_trends": "Тренды",
  "h_trends": "Определяет, что взрывается прямо сейчас в вашей нише (реальные свежие видео) + ИИ-анализ.",
  "tre_intro": "Что в тренде СЕЙЧАС в вашей нише: взрывные видео + растущие тренды и ключевые слова.",
  "tre_run": "Определить тренды",
  "tre_need": "Сначала выберите нишу",
  "tre_trends": "🔥 Текущие тренды",
  "tre_keywords": "📈 Растущие ключевые слова",
  "tre_advice": "💡 Как их использовать",
  "tre_hot": "🚀 Взрывные видео (свежие)",
  "tre_none": "Тренды не найдены. Попробуйте более широкую нишу.",
  "nav_planner": "Планировщик",
  "h_planner": "Создаёт 7-дневный календарь под вашу нишу для регулярных публикаций.",
  "plan_intro": "Создайте план на 7 дней: что публиковать каждый день + лучший временной слот.",
  "plan_freq": "Частота (необязательно)",
  "plan_run": "Создать мой план на 7 дней",
  "tr_section": "Локализация / Перевод",
  "h_translate": "Переводит и адаптирует ваш заголовок, описание и теги на другой язык.",
  "tr_intro": "Переведите заголовок + описание + теги на язык, чтобы охватить мировую аудиторию.",
  "tr_run": "Перевести",
  "tr_title": "Переведённый заголовок",
  "tr_desc": "Переведённое описание",
  "tr_copy": "Копировать перевод",
  "cp_section": "Посты сообщества",
  "h_community": "Генерирует опросы, вопросы и тизеры для вкладки Сообщество.",
  "cp_intro": "Создайте 5 постов (опросы, вопросы, тизеры), чтобы вовлекать аудиторию между видео.",
  "cp_run": "Создать 5 постов",
  "sc_section": "Полный сценарий",
  "h_script": "Пишет структурированный сценарий (хук, разделы, призыв) по теме.",
  "sc_intro": "Дайте тему: ИИ напишет полный сценарий (хук, интро, разделы, призыв, концовка).",
  "sc_topic_ph": "Тема видео…",
  "sc_dur": "Длительность",
  "sc_run": "Написать сценарий",
  "sc_need": "Сначала введите тему",
  "sc_hook": "Хук (первые 5 сек)",
  "sc_copy": "Копировать сценарий",
  "pc_section": "Проверка заголовок + превью",
  "h_pair": "Проверяет, что заголовок и превью дополняют друг друга и читаемы на ТВ и мобильном.",
  "pc_intro": "ИИ проверяет, что заголовок и превью дополняют друг друга (без повтора) и их читаемость.",
  "pc_run": "Проверить пару",
  "pc_complement": "Дополняют",
  "pc_issues": "⚠️ Проблемы",
  "pc_tips": "✅ Советы",
  "pl_section": "Оптимизатор плейлистов",
  "h_playlists": "Группирует ваши видео в оптимизированные плейлисты для времени сессии.",
  "pl_intro": "ИИ группирует ваши видео в оптимизированные плейлисты (больше времени просмотра).",
  "pl_run": "Оптимизировать мои плейлисты",
  "au_section": "Полный аудит в 1 клик",
  "h_audit": "Запускает SEO + Превью + Заголовок сразу и даёт приоритетный план действий.",
  "au_run": "Запустить полный аудит",
  "au_global": "Общая оценка видео",
  "au_plan": "🎯 Приоритетный план действий",
  "ob_title": "Добро пожаловать в VidSpark AI!",
  "ob_sub": "24 ИИ-инструмента для оптимизации видео. Вот главное:",
  "ob_audit": "полный аудит в 1 клик",
  "ob_title2": "оценка CTR заголовка в реальном времени",
  "ob_thumb": "сравнить 2 превью",
  "ob_shorts": "идеи Shorts + клипы для нарезки",
  "ob_sponsor": "оцените доход от спонсорства",
  "ob_btn": "Поехали 🚀",
  "nav_channel": "Канал",
  "chan_intro": "Дашборд канала: реальная статистика + оценка здоровья и ИИ-рекомендации.",
  "chan_run": "Анализировать мой канал",
  "chan_subs": "Подписчики",
  "chan_views": "Всего просмотров",
  "chan_vids": "Видео",
  "chan_avg": "Ср. просмотры",
  "chan_eng": "Вовлечённость",
  "chan_freq": "Частота",
  "chan_ai_loading": "ИИ-диагностика выполняется…",
  "chan_ai_fail": "ИИ-диагностика недоступна",
  "chan_health": "Оценка здоровья",
  "chan_strengths": "✅ Сильные стороны",
  "chan_weak": "⚠️ Слабые стороны",
  "chan_reco": "💡 Рекомендации",
  "nav_comments": "Комментарии",
  "com_intro": "ИИ читает комментарии: тональность, запросы аудитории, идеи видео и предлагаемые ответы.",
  "com_run": "Анализировать комментарии",
  "com_none": "Комментариев к этому видео не найдено.",
  "com_loading": "💬 Чтение и анализ комментариев…",
  "com_sentiment": "Общая тональность",
  "com_pos": "Позитивная",
  "com_neu": "Нейтральная",
  "com_neg": "Негативная",
  "com_requests": "🙋 Запросы аудитории",
  "com_ideas": "💡 Идеи для следующего видео",
  "com_replies": "✍️ Предлагаемые ответы",
  "com_copy": "Копировать",
  "nav_ideas": "Идеи",
  "idea_intro": "Выберите нишу, регион и необязательную тему: ИИ предложит 10 перспективных идей видео.",
  "idea_topic_ph": "Тема или ключевое слово (необязательно)…",
  "idea_run": "Создать 10 идей",
  "idea_copy": "Копировать заголовок",
  "kw_opportunity": "Оценка возможности",
  "kw_difficulty": "Сложность",
  "kw_demand": "Спрос",
  "kw_trend": "Тренд",
  "kw_best": "🎯 Целевые ключевые слова",
  "kw_competition": "Конкуренция",
  "seo_tab_analyse": "📊 Анализ",
  "seo_tab_optim": "🎯 Оптимизация",
  "seo_tab_kw": "🔑 Ключевые слова",
  "seo_tab_rec_kw": "Рекомендуемые ключевые слова",
  "seo_tab_issues": "проблемы",
  "seo_all_ok": "Все критерии выполнены!",
  "example_label": "Пример:",
  "recommendation_label": "РЕКОМЕНДАЦИЯ:",
  "impact_pos_num": "Положительный эффект +8% к ожидаемому CTR",
  "impact_neg_num": "Добавление числа может повысить CTR на 15–40%",
  "viral_pos_hook": "CTR-хук в начале заголовка",
  "viral_pos_num": "Число в заголовке",
  "viral_pos_em": "Есть эмоциональное слово",
  "viral_pos_desc": "Описание достаточно длинное",
  "viral_pos_len": "Оптимальная длина заголовка",
  "viral_neg_hook": "Нет CTR-хука — добавьте вопрос или число в начало",
  "viral_neg_num": "Нет числа — заголовки с числами дают +40% CTR",
  "viral_neg_em": "Нет эмоционального слова — добавьте сильное слово",
  "viral_neg_desc_tpl": "Короткое описание (N символов) — стремитесь к 500+",
  "viral_neg_len_short": "Заголовок слишком короткий",
  "viral_neg_len_long": "Заголовок слишком длинный",
  "viral_potential_title": "Оценка вирусного потенциала",
  "btn_viral_ai": "✨ Вирусный ИИ-анализ"
 },
 "ko": {
  "nav_abtest": "A/B 테스트",
  "abtest_intro": "두 제목을 비교하세요: AI가 어느 쪽이 클릭률이 높을지 예측합니다.",
  "abtest_a": "제목 A",
  "abtest_b": "제목 B",
  "abtest_run": "⚔️ 제목 비교",
  "abtest_winner": "승자",
  "abtest_verdict": "AI 판정",
  "abtest_improved": "💡 추천 제목 (더 나음)",
  "abtest_ctr": "예상 CTR",
  "abtest_confidence": "신뢰도",
  "abtest_use": "이 제목 사용",
  "thumbab_title": "썸네일 A/B",
  "thumbab_intro": "썸네일 2개 비교: Vision AI가 어느 쪽이 CTR이 높은지와 이유를 알려줍니다.",
  "thumbab_a": "썸네일 A",
  "thumbab_b": "썸네일 B",
  "thumbab_run": "📸 썸네일 비교",
  "thumbab_tips": "💡 승자를 개선하려면",
  "thumbab_need2": "먼저 이미지 2개를 선택하세요",
  "thumbab_prompt_label": "🎨 개선된 썸네일을 만들기 위한 상세 프롬프트:",
  "thumbab_prompt_copy": "프롬프트 복사",
  "thumbab_prompt_hint": "이 프롬프트를 이미지 AI(Midjourney, DALL·E, ChatGPT, Leonardo…)에 붙여넣어 썸네일을 생성하세요.",
  "nav_shorts": "Shorts",
  "shorts_intro": "이 영상을 바이럴 Shorts 아이디어로 바꾸세요 (제목, 후크, 대본, 해시태그).",
  "shorts_generate": "🎬 Shorts 생성",
  "shorts_hook": "후크 (첫 3초)",
  "shorts_script": "대본",
  "shorts_duration": "길이",
  "shorts_copy": "대본 복사",
  "shorts_summary": "요약",
  "shorts_clips": "✂️ 자를 클립",
  "shorts_estimated": "예상",
  "shorts_real": "자막 기준",
  "live_stats_title": "실제 YouTube 통계",
  "live_stats_btn": "실제 데이터 불러오기 (조회수/시간, 태그…)",
  "audit_title": "채널 진단",
  "audit_btn": "이 채널 진단",
  "thumb_ai_title": "AI 썸네일 분석",
  "thumb_ai_btn": "내 썸네일 분석 (AI)",
  "thumb_ideas_title": "썸네일 콘셉트 생성",
  "thumb_ideas_intro": "제목 기반 3개 콘셉트(텍스트, 색상, 레이아웃, 얼굴), 바로 실행 가능.",
  "thumb_ideas_btn": "콘셉트 3개 생성",
  "thumb_ideas_loading": "콘셉트 생성 중…",
  "thumb_ideas_concept": "콘셉트",
  "thumb_ideas_emotion": "감정",
  "thumb_ideas_text": "텍스트",
  "thumb_ideas_focal": "초점",
  "thumb_ideas_face": "얼굴",
  "thumb_ideas_bg": "배경",
  "thumb_ideas_why": "이유",
  "thumb_ideas_copy": "브리프 복사",
  "thumb_ideas_locked_sub": "Pro로 업그레이드하여 콘셉트 3개 모두 잠금 해제",
  "thumb_ideas_niche_ph": "분야 (선택, 예: 요리, 게임)",
  "thumb_gen_btn": "🖼️ 배경 생성",
  "thumb_gen_loading": "배경 생성 중…",
  "thumb_gen_overlay_note": "AI 생성 배경 + 덧입힌 텍스트 (이미지 AI는 특히 아랍어 텍스트를 잘 못 씁니다).",
  "thumb_gen_text_ph": "이미지 위 제목 텍스트…",
  "thumb_gen_download": "이미지 다운로드",
  "thumb_gen_downloaded": "이미지 다운로드됨",
  "thumb_gen_drag_note": "2줄: 텍스트 입력, 각 줄 드래그, 색상/크기/글꼴 선택 후 다운로드.",
  "thumb_gen_line": "줄",
  "thumb_gen_color": "색상",
  "thumb_gen_font": "글꼴",
  "thumb_gen_size": "크기",
  "real_comp_title": "실제 경쟁자",
  "real_comp_btn": "잘나가는 실제 영상 보기",
  "keywords_title": "키워드 리서치",
  "keywords_ph": "예: 닭고기 레시피",
  "title_types": "제목 유형",
  "result_label": "결과",
  "hook_title": "후크 분석기",
  "hook_intro": "인트로 대본(첫 15-30초)을 붙여넣으세요: AI가 시청 지속률과 이탈 지점을 예측합니다.",
  "hook_ph": "여기에 인트로 텍스트를 붙여넣으세요…",
  "hook_run": "지속률 분석",
  "hook_need": "최소한 인트로를 붙여넣으세요",
  "hook_retention": "예상 지속률",
  "hook_score_label": "후크 점수",
  "hook_drops": "⚠️ 이탈 지점",
  "hook_fixes": "✅ 개선",
  "hook_rewrite": "💡 다시 쓴 인트로 (개선)",
  "nav_region": "지역",
  "audience_intro": "타깃(전 세계, 지역 또는 국가)과 언어를 선택하세요: AI가 최적 시간, 트렌드, 해시태그, 주제를 제시합니다.",
  "audience_target": "타깃 (국가 / 지역 / 전 세계)",
  "audience_target_ph": "예: 알제리, MENA, 프랑스, 전 세계…",
  "audience_worldwide": "전 세계",
  "audience_niche": "분야 / 채널 스타일",
  "audience_niche_ph": "예: 게임, 요리, 테크, 축구…",
  "audience_lang": "콘텐츠 언어",
  "audience_run": "이 시청자에 맞게 최적화",
  "audience_times": "📅 최적 업로드 시간",
  "audience_trends": "📈 트렌드 및 포맷",
  "audience_hashtags": "🏷️ 지역화 해시태그",
  "audience_topics": "💡 주제 아이디어",
  "audience_tips": "🎯 팁",
  "titles_section": "AI 제목",
  "td_title": "제목 닥터",
  "td_run": "심층 AI 진단",
  "td_need": "먼저 제목을 입력하세요",
  "td_len": "길이",
  "td_num": "숫자",
  "td_emotion": "강력한 단어",
  "td_hook": "후크",
  "td_punct": "구두점",
  "td_ai_score": "CTR 점수",
  "td_missing": "⚠️ 부족한 점",
  "td_improved": "💡 개선된 제목",
  "td_tips": "✅ 팁",
  "tdh_len": "이상적 40-70자: YouTube에서 잘리지 않으면서 충분히 설명적.",
  "tdh_num": "숫자는 제목을 구체화하고(예: 팁 5개, 2024) 눈길을 끕니다.",
  "tdh_emotion": "강력한 단어(놀라운, 비밀, 무료, 충격적…)는 클릭을 유도합니다.",
  "tdh_hook": "시작 부분의 후크(어떻게, 왜, 질문…)는 호기심을 만듭니다.",
  "tdh_punct": "? 또는 !는 감정을 더하고 클릭하고 싶게 합니다.",
  "h_titledoctor": "제목을 실시간으로 채점하고 더 많은 클릭을 위한 최적화 버전을 제안합니다.",
  "h_titles": "최적화된 제목 5개 변형 생성 (SEO, CTR, 바이럴, Shorts, 트렌드).",
  "h_desc": "구독 CTA, 해시태그, SEO 태그 15개가 포함된 전체 설명 생성.",
  "h_abtest": "두 제목 비교: AI가 어느 쪽이 클릭률이 높을지 예측합니다.",
  "h_thumbab": "썸네일 2개 비교: Vision AI가 어느 쪽이 더 많은 클릭을 받는지와 이유를 알려줍니다.",
  "h_shorts": "영상을 자를 정확한 클립과 함께 Shorts 아이디어 3개로 변환.",
  "h_hook": "인트로를 분석하여 지속률과 시청자 이탈 지점을 예측.",
  "h_audience": "지역과 분야에 맞는 최적 시간, 트렌드, 해시태그, 주제.",
  "h_revenue": "영상의 7일 조회수와 AdSense 수익을 추정.",
  "h_channel": "실제 채널 통계 + 건강 점수와 AI 추천.",
  "h_comments": "댓글 감정과 요청을 요약하고 답변을 제안.",
  "h_ideas": "분야에 맞춘 잠재력 높은 영상 아이디어 10개 제안.",
  "desc_section": "전체 설명",
  "desc_intro": "제목 + 분야 + 지역 → 구독 CTA, 해시태그, 태그가 포함된 설명.",
  "desc_title": "영상 제목",
  "desc_title_ph": "영상 제목…",
  "desc_run": "전체 설명 생성",
  "desc_need": "먼저 제목을 입력하세요",
  "desc_ready": "✅ 붙여넣기 준비된 설명",
  "desc_copy": "설명 복사",
  "desc_tags": "🏷️ SEO 태그",
  "desc_copy_tags": "태그 복사",
  "chap_section": "챕터",
  "chap_intro": "설명에 붙여넣을 타임스탬프 챕터(자막 기반)를 생성.",
  "chap_run": "챕터 생성",
  "chap_copy": "챕터 복사",
  "chap_none": "이 영상의 자막을 사용할 수 없습니다.",
  "nav_revenue": "수익",
  "rev_intro": "분야, 시청자, 구독자를 기반으로 7일 조회수와 AdSense 수익을 추정.",
  "rev_subs": "채널 구독자 수",
  "rev_subs_ph": "예: 6m, 14k, 5000",
  "rev_run": "조회수 및 수익 추정",
  "rev_views": "조회수 (D+7)",
  "rev_income": "예상 수익",
  "rev_factors": "📊 핵심 요인",
  "rev_tips": "💡 늘리려면",
  "rev_disclaimer": "AI 기반 추정 — 실제 결과는 다를 수 있습니다.",
  "nav_sponsor": "스폰서",
  "h_sponsor": "스폰서 단가를 추정하고 브랜드 피치, 미디어 키트, 제휴 아이디어를 생성.",
  "sp_intro": "스폰서 가치를 추정하고 거래를 성사시킬 피치 + 미디어 키트를 생성.",
  "sp_subs_ph": "구독자 (예: 6m, 14k)",
  "sp_views_ph": "영상당 평균 조회수 (예: 50k)",
  "sp_run": "내 스폰서 키트 생성",
  "sp_rate": "예상 스폰서 단가 (영상당)",
  "sp_pitch": "✉️ 브랜드 피치 메시지",
  "sp_copy_pitch": "피치 복사",
  "sp_mediakit": "📋 미디어 키트 (장점)",
  "sp_brands": "🏢 어울리는 브랜드",
  "sp_affiliate": "🔗 제휴 아이디어",
  "sp_disclaimer": "AI 추정 — 실제 참여도를 기준으로 협상하세요.",
  "nav_trends": "트렌드",
  "h_trends": "분야에서 지금 폭발하는 것을 감지(실제 최신 영상) + AI 분석.",
  "tre_intro": "지금 당신의 분야에서 뜨는 것: 폭발하는 영상 + 떠오르는 트렌드와 키워드.",
  "tre_run": "트렌드 감지",
  "tre_need": "먼저 분야를 선택하세요",
  "tre_trends": "🔥 현재 트렌드",
  "tre_keywords": "📈 떠오르는 키워드",
  "tre_advice": "💡 활용 방법",
  "tre_hot": "🚀 폭발하는 영상 (최신)",
  "tre_none": "트렌드를 찾지 못했습니다. 더 넓은 분야를 시도하세요.",
  "nav_planner": "플래너",
  "h_planner": "꾸준한 업로드를 위해 분야에 맞춘 7일 캘린더를 생성.",
  "plan_intro": "7일 계획 생성: 매일 무엇을 올릴지 + 최적 시간대.",
  "plan_freq": "주기 (선택)",
  "plan_run": "내 7일 계획 생성",
  "tr_section": "현지화 / 번역",
  "h_translate": "제목, 설명, 태그를 다른 언어로 번역하고 현지화.",
  "tr_intro": "제목 + 설명 + 태그를 한 언어로 번역하여 글로벌 시청자에게 도달.",
  "tr_run": "번역",
  "tr_title": "번역된 제목",
  "tr_desc": "번역된 설명",
  "tr_copy": "번역 복사",
  "cp_section": "커뮤니티 게시물",
  "h_community": "커뮤니티 탭용 투표, 질문, 티저를 생성.",
  "cp_intro": "영상 사이에 시청자를 참여시킬 게시물 5개(투표, 질문, 티저)를 생성.",
  "cp_run": "게시물 5개 생성",
  "sc_section": "전체 대본",
  "h_script": "주제로부터 구조화된 대본(후크, 섹션, CTA)을 작성.",
  "sc_intro": "주제를 입력하세요: AI가 전체 대본(후크, 인트로, 섹션, CTA, 아웃트로)을 작성.",
  "sc_topic_ph": "영상 주제…",
  "sc_dur": "길이",
  "sc_run": "대본 작성",
  "sc_need": "먼저 주제를 입력하세요",
  "sc_hook": "후크 (첫 5초)",
  "sc_copy": "대본 복사",
  "pc_section": "제목 + 썸네일 확인",
  "h_pair": "제목과 썸네일이 서로 보완되고 TV와 모바일에서 읽기 쉬운지 확인.",
  "pc_intro": "AI가 제목과 썸네일이 서로 보완되는지(중복 없이)와 가독성을 확인.",
  "pc_run": "쌍 확인",
  "pc_complement": "상호 보완",
  "pc_issues": "⚠️ 문제",
  "pc_tips": "✅ 팁",
  "pl_section": "재생목록 최적화",
  "h_playlists": "세션 시간을 위해 영상을 최적화된 재생목록으로 그룹화.",
  "pl_intro": "AI가 영상을 최적화된 재생목록으로 그룹화(시청 시간 증가).",
  "pl_run": "내 재생목록 최적화",
  "au_section": "원클릭 전체 진단",
  "h_audit": "SEO + 썸네일 + 제목을 한 번에 실행하고 우선순위 실행 계획을 제공.",
  "au_run": "전체 진단 실행",
  "au_global": "영상 종합 점수",
  "au_plan": "🎯 우선순위 실행 계획",
  "ob_title": "VidSpark AI에 오신 것을 환영합니다!",
  "ob_sub": "영상을 최적화하는 24개 AI 도구. 핵심은 다음과 같습니다:",
  "ob_audit": "원클릭 전체 진단",
  "ob_title2": "제목 실시간 CTR 점수",
  "ob_thumb": "썸네일 2개 비교",
  "ob_shorts": "Shorts 아이디어 + 자를 클립",
  "ob_sponsor": "스폰서 수익 추정",
  "ob_btn": "시작하기 🚀",
  "nav_channel": "채널",
  "chan_intro": "채널 대시보드: 실제 통계 + 건강 점수와 AI 추천.",
  "chan_run": "내 채널 분석",
  "chan_subs": "구독자",
  "chan_views": "총 조회수",
  "chan_vids": "영상",
  "chan_avg": "평균 조회수",
  "chan_eng": "참여도",
  "chan_freq": "빈도",
  "chan_ai_loading": "AI 진단 진행 중…",
  "chan_ai_fail": "AI 진단 사용 불가",
  "chan_health": "건강 점수",
  "chan_strengths": "✅ 강점",
  "chan_weak": "⚠️ 약점",
  "chan_reco": "💡 추천",
  "nav_comments": "댓글",
  "com_intro": "AI가 댓글을 읽습니다: 감정, 시청자 요청, 영상 아이디어, 추천 답변.",
  "com_run": "댓글 분석",
  "com_none": "이 영상에서 댓글을 찾지 못했습니다.",
  "com_loading": "💬 댓글 읽기 및 분석 중…",
  "com_sentiment": "전체 감정",
  "com_pos": "긍정",
  "com_neu": "중립",
  "com_neg": "부정",
  "com_requests": "🙋 시청자 요청",
  "com_ideas": "💡 다음 영상 아이디어",
  "com_replies": "✍️ 추천 답변",
  "com_copy": "복사",
  "nav_ideas": "아이디어",
  "idea_intro": "분야, 지역, 선택 주제를 고르세요: AI가 잠재력 높은 영상 아이디어 10개를 제안합니다.",
  "idea_topic_ph": "주제 또는 키워드 (선택)…",
  "idea_run": "아이디어 10개 생성",
  "idea_copy": "제목 복사",
  "kw_opportunity": "기회 점수",
  "kw_difficulty": "난이도",
  "kw_demand": "수요",
  "kw_trend": "트렌드",
  "kw_best": "🎯 공략할 키워드",
  "kw_competition": "경쟁",
  "seo_tab_analyse": "📊 분석",
  "seo_tab_optim": "🎯 최적화",
  "seo_tab_kw": "🔑 키워드",
  "seo_tab_rec_kw": "추천 키워드",
  "seo_tab_issues": "문제",
  "seo_all_ok": "모든 기준 충족!",
  "example_label": "예시:",
  "recommendation_label": "추천:",
  "impact_pos_num": "긍정적 영향 +8% 예상 CTR",
  "impact_neg_num": "숫자를 추가하면 CTR이 15–40% 증가할 수 있습니다",
  "viral_pos_hook": "제목 시작의 CTR 후크",
  "viral_pos_num": "제목 내 숫자",
  "viral_pos_em": "감정 단어 있음",
  "viral_pos_desc": "충분히 긴 설명",
  "viral_pos_len": "최적 제목 길이",
  "viral_neg_hook": "CTR 후크 없음 — 시작에 질문이나 숫자를 추가하세요",
  "viral_neg_num": "숫자 없음 — 숫자가 있는 제목은 +40% CTR",
  "viral_neg_em": "감정 단어 없음 — 강력한 단어를 추가하세요",
  "viral_neg_desc_tpl": "짧은 설명 (N자) — 500자 이상을 목표로",
  "viral_neg_len_short": "제목이 너무 짧음",
  "viral_neg_len_long": "제목이 너무 김",
  "viral_potential_title": "바이럴 잠재력 점수",
  "btn_viral_ai": "✨ 바이럴 AI 분석"
 },
 "hi": {
  "nav_abtest": "A/B टेस्ट",
  "abtest_intro": "दो शीर्षकों की तुलना करें: AI बताता है कि किसे ज़्यादा क्लिक मिलेंगे।",
  "abtest_a": "शीर्षक A",
  "abtest_b": "शीर्षक B",
  "abtest_run": "⚔️ शीर्षकों की तुलना करें",
  "abtest_winner": "विजेता",
  "abtest_verdict": "AI निर्णय",
  "abtest_improved": "💡 सुझाया गया शीर्षक (और बेहतर)",
  "abtest_ctr": "अनुमानित CTR",
  "abtest_confidence": "विश्वास",
  "abtest_use": "यह शीर्षक उपयोग करें",
  "thumbab_title": "थंबनेल A/B",
  "thumbab_intro": "2 थंबनेल की तुलना करें: Vision AI बताता है किसे ज़्यादा CTR मिलेगा और क्यों।",
  "thumbab_a": "थंबनेल A",
  "thumbab_b": "थंबनेल B",
  "thumbab_run": "📸 थंबनेल की तुलना करें",
  "thumbab_tips": "💡 विजेता को बेहतर करने के लिए",
  "thumbab_need2": "पहले 2 इमेज चुनें",
  "thumbab_prompt_label": "🎨 बेहतर थंबनेल बनाने के लिए विस्तृत प्रॉम्प्ट:",
  "thumbab_prompt_copy": "प्रॉम्प्ट कॉपी करें",
  "thumbab_prompt_hint": "इस प्रॉम्प्ट को किसी इमेज AI (Midjourney, DALL·E, ChatGPT, Leonardo…) में पेस्ट करके अपना थंबनेल बनाएं।",
  "nav_shorts": "Shorts",
  "shorts_intro": "इस वीडियो को वायरल Shorts आइडिया में बदलें (शीर्षक, हुक, स्क्रिप्ट, हैशटैग)।",
  "shorts_generate": "🎬 Shorts बनाएं",
  "shorts_hook": "हुक (पहले 3 सेकंड)",
  "shorts_script": "स्क्रिप्ट",
  "shorts_duration": "अवधि",
  "shorts_copy": "स्क्रिप्ट कॉपी करें",
  "shorts_summary": "सारांश",
  "shorts_clips": "✂️ काटने वाले क्लिप",
  "shorts_estimated": "अनुमानित",
  "shorts_real": "कैप्शन के आधार पर",
  "live_stats_title": "असली YouTube आँकड़े",
  "live_stats_btn": "असली डेटा लोड करें (व्यू/घंटा, टैग…)",
  "audit_title": "चैनल ऑडिट",
  "audit_btn": "इस चैनल का ऑडिट करें",
  "thumb_ai_title": "AI थंबनेल विश्लेषण",
  "thumb_ai_btn": "मेरा थंबनेल विश्लेषण करें (AI)",
  "thumb_ideas_title": "थंबनेल कॉन्सेप्ट बनाएं",
  "thumb_ideas_intro": "आपके शीर्षक पर आधारित 3 कॉन्सेप्ट (टेक्स्ट, रंग, लेआउट, चेहरा), तुरंत लागू करने योग्य।",
  "thumb_ideas_btn": "3 कॉन्सेप्ट बनाएं",
  "thumb_ideas_loading": "कॉन्सेप्ट बन रहे हैं…",
  "thumb_ideas_concept": "कॉन्सेप्ट",
  "thumb_ideas_emotion": "भावना",
  "thumb_ideas_text": "टेक्स्ट",
  "thumb_ideas_focal": "फोकल पॉइंट",
  "thumb_ideas_face": "चेहरा",
  "thumb_ideas_bg": "बैकग्राउंड",
  "thumb_ideas_why": "क्यों",
  "thumb_ideas_copy": "ब्रीफ कॉपी करें",
  "thumb_ideas_locked_sub": "सभी 3 कॉन्सेप्ट अनलॉक करने के लिए Pro पर अपग्रेड करें",
  "thumb_ideas_niche_ph": "निच (वैकल्पिक, जैसे कुकिंग, गेमिंग)",
  "thumb_gen_btn": "🖼️ बैकग्राउंड बनाएं",
  "thumb_gen_loading": "बैकग्राउंड बन रहा है…",
  "thumb_gen_overlay_note": "AI-निर्मित बैकग्राउंड + आपका ओवरले टेक्स्ट (इमेज AI टेक्स्ट ठीक से नहीं लिखता, खासकर अरबी)।",
  "thumb_gen_text_ph": "इमेज पर शीर्षक टेक्स्ट…",
  "thumb_gen_download": "इमेज डाउनलोड करें",
  "thumb_gen_downloaded": "इमेज डाउनलोड हो गई",
  "thumb_gen_drag_note": "2 लाइनें: टेक्स्ट टाइप करें, हर लाइन खींचें, रंग/आकार/फॉन्ट चुनें, फिर डाउनलोड करें।",
  "thumb_gen_line": "लाइन",
  "thumb_gen_color": "रंग",
  "thumb_gen_font": "फॉन्ट",
  "thumb_gen_size": "आकार",
  "real_comp_title": "असली प्रतियोगी",
  "real_comp_btn": "टॉप पर चल रहे असली वीडियो देखें",
  "keywords_title": "कीवर्ड रिसर्च",
  "keywords_ph": "जैसे चिकन रेसिपी",
  "title_types": "शीर्षक प्रकार",
  "result_label": "परिणाम",
  "hook_title": "हुक विश्लेषक",
  "hook_intro": "अपनी इंट्रो स्क्रिप्ट (पहले 15-30 सेकंड) पेस्ट करें: AI रिटेंशन और दर्शकों के छोड़ने की जगह बताता है।",
  "hook_ph": "अपना इंट्रो टेक्स्ट यहाँ पेस्ट करें…",
  "hook_run": "रिटेंशन विश्लेषण करें",
  "hook_need": "कम से कम अपना इंट्रो पेस्ट करें",
  "hook_retention": "अनुमानित रिटेंशन",
  "hook_score_label": "हुक स्कोर",
  "hook_drops": "⚠️ छोड़ने वाले बिंदु",
  "hook_fixes": "✅ सुधार",
  "hook_rewrite": "💡 दोबारा लिखी इंट्रो (बेहतर)",
  "nav_region": "क्षेत्र",
  "audience_intro": "अपना लक्ष्य (वैश्विक, क्षेत्र या देश) और भाषा चुनें: AI सर्वोत्तम समय, ट्रेंड, हैशटैग और विषय देता है।",
  "audience_target": "लक्ष्य (देश / क्षेत्र / वैश्विक)",
  "audience_target_ph": "जैसे अल्जीरिया, MENA, फ़्रांस, वैश्विक…",
  "audience_worldwide": "वैश्विक",
  "audience_niche": "निच / चैनल शैली",
  "audience_niche_ph": "जैसे गेमिंग, कुकिंग, टेक, फुटबॉल…",
  "audience_lang": "कंटेंट भाषा",
  "audience_run": "इस ऑडियंस के लिए ऑप्टिमाइज़ करें",
  "audience_times": "📅 पोस्ट करने का सर्वोत्तम समय",
  "audience_trends": "📈 ट्रेंड और फॉर्मैट",
  "audience_hashtags": "🏷️ स्थानीय हैशटैग",
  "audience_topics": "💡 विषय आइडिया",
  "audience_tips": "🎯 टिप्स",
  "titles_section": "AI शीर्षक",
  "td_title": "टाइटल डॉक्टर",
  "td_run": "गहन AI निदान",
  "td_need": "पहले एक शीर्षक टाइप करें",
  "td_len": "लंबाई",
  "td_num": "संख्या",
  "td_emotion": "प्रभावी शब्द",
  "td_hook": "हुक",
  "td_punct": "विराम चिह्न",
  "td_ai_score": "CTR स्कोर",
  "td_missing": "⚠️ क्या कमी है",
  "td_improved": "💡 बेहतर शीर्षक",
  "td_tips": "✅ टिप्स",
  "tdh_len": "आदर्श 40-70 अक्षर: पर्याप्त वर्णनात्मक, YouTube द्वारा कटे बिना।",
  "tdh_num": "संख्या शीर्षक को ठोस बनाती है (जैसे 5 टिप्स, 2024) और ध्यान खींचती है।",
  "tdh_emotion": "एक प्रभावी शब्द (अद्भुत, रहस्य, मुफ़्त, चौंकाने वाला…) क्लिक करवाता है।",
  "tdh_hook": "शुरुआत में हुक (कैसे, क्यों, एक सवाल…) जिज्ञासा पैदा करता है।",
  "tdh_punct": "? या ! भावना जोड़ता है और क्लिक करने का मन बनाता है।",
  "h_titledoctor": "आपके शीर्षक को लाइव स्कोर करता है और ज़्यादा क्लिक के लिए ऑप्टिमाइज़्ड संस्करण सुझाता है।",
  "h_titles": "5 ऑप्टिमाइज़्ड शीर्षक वैरिएंट बनाता है (SEO, CTR, वायरल, Shorts, ट्रेंडिंग)।",
  "h_desc": "सब्सक्राइब CTA, हैशटैग और 15 SEO टैग के साथ पूरा विवरण बनाता है।",
  "h_abtest": "2 शीर्षकों की तुलना: AI बताता है किसे ज़्यादा क्लिक मिलेंगे।",
  "h_thumbab": "2 थंबनेल की तुलना: Vision AI बताता है किसे ज़्यादा क्लिक मिलेंगे और क्यों।",
  "h_shorts": "वीडियो को काटने के सटीक क्लिप के साथ 3 Shorts आइडिया में बदलता है।",
  "h_hook": "आपकी इंट्रो का विश्लेषण करता है और रिटेंशन + दर्शकों के छोड़ने की जगह बताता है।",
  "h_audience": "आपके क्षेत्र और निच के लिए सर्वोत्तम समय, ट्रेंड, हैशटैग और विषय।",
  "h_revenue": "आपके वीडियो के 7-दिन व्यू और AdSense आय का अनुमान।",
  "h_channel": "असली चैनल आँकड़े + हेल्थ स्कोर और AI सिफारिशें।",
  "h_comments": "कमेंट की भावना, अनुरोधों का सारांश और जवाब सुझाता है।",
  "h_ideas": "आपके निच के अनुरूप 10 उच्च-संभावना वीडियो आइडिया सुझाता है।",
  "desc_section": "पूरा विवरण",
  "desc_intro": "शीर्षक + निच + क्षेत्र → सब्सक्राइब CTA, हैशटैग और टैग के साथ विवरण।",
  "desc_title": "वीडियो शीर्षक",
  "desc_title_ph": "आपका वीडियो शीर्षक…",
  "desc_run": "पूरा विवरण बनाएं",
  "desc_need": "पहले एक शीर्षक दर्ज करें",
  "desc_ready": "✅ पेस्ट करने को तैयार विवरण",
  "desc_copy": "विवरण कॉपी करें",
  "desc_tags": "🏷️ SEO टैग",
  "desc_copy_tags": "टैग कॉपी करें",
  "chap_section": "चैप्टर",
  "chap_intro": "विवरण में पेस्ट करने के लिए टाइमस्टैम्प चैप्टर (कैप्शन से) बनाएं।",
  "chap_run": "चैप्टर बनाएं",
  "chap_copy": "चैप्टर कॉपी करें",
  "chap_none": "इस वीडियो के लिए कैप्शन उपलब्ध नहीं हैं।",
  "nav_revenue": "आय",
  "rev_intro": "अपने निच, ऑडियंस और सब्सक्राइबर के आधार पर 7-दिन व्यू और AdSense आय का अनुमान लगाएं।",
  "rev_subs": "आपके चैनल के सब्सक्राइबर",
  "rev_subs_ph": "जैसे 6m, 14k, 5000",
  "rev_run": "व्यू और आय का अनुमान लगाएं",
  "rev_views": "व्यू (D+7)",
  "rev_income": "अनुमानित आय",
  "rev_factors": "📊 मुख्य कारक",
  "rev_tips": "💡 बढ़ाने के लिए",
  "rev_disclaimer": "AI-आधारित अनुमान — वास्तविक परिणाम भिन्न हो सकते हैं।",
  "nav_sponsor": "स्पॉन्सर",
  "h_sponsor": "आपकी स्पॉन्सरशिप दर का अनुमान, ब्रांड पिच, मीडिया किट और एफिलिएट आइडिया बनाता है।",
  "sp_intro": "अपनी स्पॉन्सरशिप कीमत का अनुमान लगाएं और डील पाने के लिए पिच + मीडिया किट बनाएं।",
  "sp_subs_ph": "सब्सक्राइबर (जैसे 6m, 14k)",
  "sp_views_ph": "औसत व्यू/वीडियो (जैसे 50k)",
  "sp_run": "मेरी स्पॉन्सर किट बनाएं",
  "sp_rate": "अनुमानित स्पॉन्सरशिप दर (प्रति वीडियो)",
  "sp_pitch": "✉️ ब्रांड पिच संदेश",
  "sp_copy_pitch": "पिच कॉपी करें",
  "sp_mediakit": "📋 मीडिया किट (मुख्य बातें)",
  "sp_brands": "🏢 उपयुक्त ब्रांड",
  "sp_affiliate": "🔗 एफिलिएट आइडिया",
  "sp_disclaimer": "AI अनुमान — अपने असली एंगेजमेंट के आधार पर मोलभाव करें।",
  "nav_trends": "ट्रेंड",
  "h_trends": "आपके निच में अभी क्या तेज़ी से बढ़ रहा है, यह पहचानता है (असली हालिया वीडियो) + AI विश्लेषण।",
  "tre_intro": "आपके निच में अभी क्या छाया हुआ है: तेज़ी से बढ़ते वीडियो + उभरते ट्रेंड और कीवर्ड।",
  "tre_run": "ट्रेंड पहचानें",
  "tre_need": "पहले एक निच चुनें",
  "tre_trends": "🔥 मौजूदा ट्रेंड",
  "tre_keywords": "📈 उभरते कीवर्ड",
  "tre_advice": "💡 इन्हें कैसे भुनाएं",
  "tre_hot": "🚀 तेज़ी से बढ़ते वीडियो (हालिया)",
  "tre_none": "कोई ट्रेंड नहीं मिला। व्यापक निच आज़माएं।",
  "nav_planner": "प्लानर",
  "h_planner": "नियमित पोस्टिंग के लिए आपके निच के अनुरूप 7-दिन कैलेंडर बनाता है।",
  "plan_intro": "7-दिन की योजना बनाएं: हर दिन क्या पोस्ट करें + सर्वोत्तम समय स्लॉट।",
  "plan_freq": "आवृत्ति (वैकल्पिक)",
  "plan_run": "मेरी 7-दिन योजना बनाएं",
  "tr_section": "स्थानीयकरण / अनुवाद",
  "h_translate": "आपके शीर्षक, विवरण और टैग का दूसरी भाषा में अनुवाद और अनुकूलन करता है।",
  "tr_intro": "वैश्विक ऑडियंस तक पहुँचने के लिए शीर्षक + विवरण + टैग का एक भाषा में अनुवाद करें।",
  "tr_run": "अनुवाद करें",
  "tr_title": "अनुवादित शीर्षक",
  "tr_desc": "अनुवादित विवरण",
  "tr_copy": "अनुवाद कॉपी करें",
  "cp_section": "कम्युनिटी पोस्ट",
  "h_community": "कम्युनिटी टैब के लिए पोल, सवाल और टीज़र बनाता है।",
  "cp_intro": "वीडियो के बीच ऑडियंस को जोड़ने के लिए 5 पोस्ट (पोल, सवाल, टीज़र) बनाएं।",
  "cp_run": "5 पोस्ट बनाएं",
  "sc_section": "पूरी स्क्रिप्ट",
  "h_script": "किसी विषय से संरचित स्क्रिप्ट (हुक, सेक्शन, CTA) लिखता है।",
  "sc_intro": "एक विषय दें: AI पूरी स्क्रिप्ट लिखता है (हुक, इंट्रो, सेक्शन, CTA, आउट्रो)।",
  "sc_topic_ph": "वीडियो विषय…",
  "sc_dur": "अवधि",
  "sc_run": "स्क्रिप्ट लिखें",
  "sc_need": "पहले एक विषय दर्ज करें",
  "sc_hook": "हुक (पहले 5 सेकंड)",
  "sc_copy": "स्क्रिप्ट कॉपी करें",
  "pc_section": "शीर्षक + थंबनेल जाँच",
  "h_pair": "जाँचता है कि आपका शीर्षक और थंबनेल एक-दूसरे के पूरक हैं और TV व मोबाइल पर पढ़ने योग्य हैं।",
  "pc_intro": "AI जाँचता है कि शीर्षक और थंबनेल एक-दूसरे के पूरक हैं (दोहराव बिना) और उनकी पठनीयता।",
  "pc_run": "जोड़ी जाँचें",
  "pc_complement": "पूरक",
  "pc_issues": "⚠️ समस्याएं",
  "pc_tips": "✅ टिप्स",
  "pl_section": "प्लेलिस्ट ऑप्टिमाइज़र",
  "h_playlists": "सेशन समय के लिए आपके वीडियो को ऑप्टिमाइज़्ड प्लेलिस्ट में समूहित करता है।",
  "pl_intro": "AI आपके वीडियो को ऑप्टिमाइज़्ड प्लेलिस्ट में समूहित करता है (ज़्यादा वॉच टाइम)।",
  "pl_run": "मेरी प्लेलिस्ट ऑप्टिमाइज़ करें",
  "au_section": "1-क्लिक पूर्ण ऑडिट",
  "h_audit": "SEO + थंबनेल + शीर्षक एक साथ चलाता है और प्राथमिकता वाली कार्य योजना देता है।",
  "au_run": "पूर्ण ऑडिट चलाएं",
  "au_global": "समग्र वीडियो स्कोर",
  "au_plan": "🎯 प्राथमिकता कार्य योजना",
  "ob_title": "VidSpark AI में आपका स्वागत है!",
  "ob_sub": "आपके वीडियो को ऑप्टिमाइज़ करने के लिए 24 AI टूल। मुख्य बातें:",
  "ob_audit": "1-क्लिक पूर्ण ऑडिट",
  "ob_title2": "आपके शीर्षक के लिए लाइव CTR स्कोर",
  "ob_thumb": "2 थंबनेल की तुलना करें",
  "ob_shorts": "Shorts आइडिया + काटने वाले क्लिप",
  "ob_sponsor": "अपनी स्पॉन्सरशिप आय का अनुमान लगाएं",
  "ob_btn": "चलिए शुरू करें 🚀",
  "nav_channel": "चैनल",
  "chan_intro": "चैनल डैशबोर्ड: असली आँकड़े + हेल्थ स्कोर और AI सिफारिशें।",
  "chan_run": "मेरा चैनल विश्लेषण करें",
  "chan_subs": "सब्सक्राइबर",
  "chan_views": "कुल व्यू",
  "chan_vids": "वीडियो",
  "chan_avg": "औसत व्यू",
  "chan_eng": "एंगेजमेंट",
  "chan_freq": "आवृत्ति",
  "chan_ai_loading": "AI निदान जारी है…",
  "chan_ai_fail": "AI निदान उपलब्ध नहीं",
  "chan_health": "हेल्थ स्कोर",
  "chan_strengths": "✅ मजबूत पक्ष",
  "chan_weak": "⚠️ कमज़ोर पक्ष",
  "chan_reco": "💡 सिफारिशें",
  "nav_comments": "कमेंट",
  "com_intro": "AI कमेंट पढ़ता है: भावना, ऑडियंस अनुरोध, वीडियो आइडिया और सुझाए गए जवाब।",
  "com_run": "कमेंट विश्लेषण करें",
  "com_none": "इस वीडियो पर कोई कमेंट नहीं मिला।",
  "com_loading": "💬 टिप्पणियाँ पढ़ी और विश्लेषित की जा रही हैं…",
  "com_sentiment": "समग्र भावना",
  "com_pos": "सकारात्मक",
  "com_neu": "तटस्थ",
  "com_neg": "नकारात्मक",
  "com_requests": "🙋 ऑडियंस अनुरोध",
  "com_ideas": "💡 अगले वीडियो आइडिया",
  "com_replies": "✍️ सुझाए गए जवाब",
  "com_copy": "कॉपी करें",
  "nav_ideas": "आइडिया",
  "idea_intro": "अपना निच, क्षेत्र और एक वैकल्पिक विषय चुनें: AI 10 उच्च-संभावना वीडियो आइडिया सुझाता है।",
  "idea_topic_ph": "विषय या कीवर्ड (वैकल्पिक)…",
  "idea_run": "10 आइडिया बनाएं",
  "idea_copy": "शीर्षक कॉपी करें",
  "kw_opportunity": "अवसर स्कोर",
  "kw_difficulty": "कठिनाई",
  "kw_demand": "मांग",
  "kw_trend": "ट्रेंड",
  "kw_best": "🎯 लक्ष्य करने योग्य कीवर्ड",
  "kw_competition": "प्रतिस्पर्धा",
  "seo_tab_analyse": "📊 विश्लेषण",
  "seo_tab_optim": "🎯 ऑप्टिमाइज़ेशन",
  "seo_tab_kw": "🔑 कीवर्ड",
  "seo_tab_rec_kw": "अनुशंसित कीवर्ड",
  "seo_tab_issues": "समस्याएं",
  "seo_all_ok": "सभी मानदंड पूरे हुए!",
  "example_label": "उदाहरण:",
  "recommendation_label": "सिफारिश:",
  "impact_pos_num": "सकारात्मक प्रभाव +8% अनुमानित CTR",
  "impact_neg_num": "संख्या जोड़ने से CTR 15–40% बढ़ सकता है",
  "viral_pos_hook": "शीर्षक की शुरुआत में CTR हुक",
  "viral_pos_num": "शीर्षक में संख्या",
  "viral_pos_em": "भावनात्मक शब्द मौजूद",
  "viral_pos_desc": "पर्याप्त लंबा विवरण",
  "viral_pos_len": "इष्टतम शीर्षक लंबाई",
  "viral_neg_hook": "कोई CTR हुक नहीं — शुरुआत में सवाल या संख्या जोड़ें",
  "viral_neg_num": "कोई संख्या नहीं — संख्या वाले शीर्षक +40% CTR पाते हैं",
  "viral_neg_em": "कोई भावनात्मक शब्द नहीं — एक प्रभावी शब्द जोड़ें",
  "viral_neg_desc_tpl": "छोटा विवरण (N अक्षर) — 500+ का लक्ष्य रखें",
  "viral_neg_len_short": "शीर्षक बहुत छोटा",
  "viral_neg_len_long": "शीर्षक बहुत लंबा",
  "viral_potential_title": "वायरल संभावना स्कोर",
  "btn_viral_ai": "✨ वायरल AI विश्लेषण"
 },
 "zh": {
  "nav_abtest": "A/B 测试",
  "abtest_intro": "比较两个标题：AI 预测哪个点击率更高。",
  "abtest_a": "标题 A",
  "abtest_b": "标题 B",
  "abtest_run": "⚔️ 比较标题",
  "abtest_winner": "获胜者",
  "abtest_verdict": "AI 判定",
  "abtest_improved": "💡 建议标题（更好）",
  "abtest_ctr": "预估点击率",
  "abtest_confidence": "置信度",
  "abtest_use": "使用此标题",
  "thumbab_title": "缩略图 A/B",
  "thumbab_intro": "比较 2 张缩略图：Vision AI 告诉你哪张点击率更高及原因。",
  "thumbab_a": "缩略图 A",
  "thumbab_b": "缩略图 B",
  "thumbab_run": "📸 比较缩略图",
  "thumbab_tips": "💡 改进获胜者",
  "thumbab_need2": "请先选择 2 张图片",
  "thumbab_prompt_label": "🎨 创建改进缩略图的详细提示词：",
  "thumbab_prompt_copy": "复制提示词",
  "thumbab_prompt_hint": "将此提示词粘贴到图像 AI（Midjourney、DALL·E、ChatGPT、Leonardo…）以生成你的缩略图。",
  "nav_shorts": "Shorts",
  "shorts_intro": "把这个视频变成爆款 Shorts 创意（标题、钩子、脚本、标签）。",
  "shorts_generate": "🎬 生成 Shorts",
  "shorts_hook": "钩子（前 3 秒）",
  "shorts_script": "脚本",
  "shorts_duration": "时长",
  "shorts_copy": "复制脚本",
  "shorts_summary": "摘要",
  "shorts_clips": "✂️ 待剪辑片段",
  "shorts_estimated": "预估",
  "shorts_real": "基于字幕",
  "live_stats_title": "真实 YouTube 数据",
  "live_stats_btn": "加载真实数据（观看/小时、标签…）",
  "audit_title": "频道审计",
  "audit_btn": "审计此频道",
  "thumb_ai_title": "AI 缩略图分析",
  "thumb_ai_btn": "分析我的缩略图（AI）",
  "thumb_ideas_title": "生成缩略图概念",
  "thumb_ideas_intro": "基于你标题的 3 个概念（文字、配色、布局、人脸），可直接执行。",
  "thumb_ideas_btn": "生成 3 个概念",
  "thumb_ideas_loading": "正在生成概念…",
  "thumb_ideas_concept": "概念",
  "thumb_ideas_emotion": "情绪",
  "thumb_ideas_text": "文字",
  "thumb_ideas_focal": "焦点",
  "thumb_ideas_face": "人脸",
  "thumb_ideas_bg": "背景",
  "thumb_ideas_why": "原因",
  "thumb_ideas_copy": "复制简报",
  "thumb_ideas_locked_sub": "升级到 Pro 解锁全部 3 个概念",
  "thumb_ideas_niche_ph": "领域（可选，如美食、游戏）",
  "thumb_gen_btn": "🖼️ 生成背景",
  "thumb_gen_loading": "正在生成背景…",
  "thumb_gen_overlay_note": "AI 生成的背景 + 你叠加的文字（图像 AI 不擅长写文字，尤其是阿拉伯语）。",
  "thumb_gen_text_ph": "图片上的标题文字…",
  "thumb_gen_download": "下载图片",
  "thumb_gen_downloaded": "图片已下载",
  "thumb_gen_drag_note": "2 行：输入文字，拖动每一行，选择颜色/大小/字体，然后下载。",
  "thumb_gen_line": "行",
  "thumb_gen_color": "颜色",
  "thumb_gen_font": "字体",
  "thumb_gen_size": "大小",
  "real_comp_title": "真实竞争对手",
  "real_comp_btn": "查看正在火爆的真实视频",
  "keywords_title": "关键词研究",
  "keywords_ph": "如 鸡肉食谱",
  "title_types": "标题类型",
  "result_label": "结果",
  "hook_title": "钩子分析器",
  "hook_intro": "粘贴你的开场脚本（前 15-30 秒）：AI 预测留存率和观众流失点。",
  "hook_ph": "在此粘贴你的开场文字…",
  "hook_run": "分析留存率",
  "hook_need": "至少粘贴你的开场",
  "hook_retention": "预估留存率",
  "hook_score_label": "钩子得分",
  "hook_drops": "⚠️ 流失点",
  "hook_fixes": "✅ 修正",
  "hook_rewrite": "💡 重写的开场（更好）",
  "nav_region": "地区",
  "audience_intro": "选择目标（全球、地区或国家）和语言：AI 给出最佳时间、趋势、标签和主题。",
  "audience_target": "目标（国家 / 地区 / 全球）",
  "audience_target_ph": "如 阿尔及利亚、MENA、法国、全球…",
  "audience_worldwide": "全球",
  "audience_niche": "领域 / 频道风格",
  "audience_niche_ph": "如 游戏、美食、科技、足球…",
  "audience_lang": "内容语言",
  "audience_run": "为此受众优化",
  "audience_times": "📅 最佳发布时间",
  "audience_trends": "📈 趋势与格式",
  "audience_hashtags": "🏷️ 本地化标签",
  "audience_topics": "💡 主题创意",
  "audience_tips": "🎯 提示",
  "titles_section": "AI 标题",
  "td_title": "标题医生",
  "td_run": "深度 AI 诊断",
  "td_need": "请先输入一个标题",
  "td_len": "长度",
  "td_num": "数字",
  "td_emotion": "有力词",
  "td_hook": "钩子",
  "td_punct": "标点",
  "td_ai_score": "点击率得分",
  "td_missing": "⚠️ 缺少什么",
  "td_improved": "💡 改进标题",
  "td_tips": "✅ 提示",
  "tdh_len": "理想 40-70 字符：足够描述又不会被 YouTube 截断。",
  "tdh_num": "数字让标题更具体（如 5 个技巧、2024）并吸引眼球。",
  "tdh_emotion": "有力词（惊人、秘密、免费、震撼…）会促使点击。",
  "tdh_hook": "开头的钩子（如何、为什么、一个问题…）能制造好奇。",
  "tdh_punct": "一个 ? 或 ! 增加情绪并让人想点击。",
  "h_titledoctor": "实时为你的标题打分，并建议更高点击率的优化版本。",
  "h_titles": "生成 5 个优化标题变体（SEO、点击率、爆款、Shorts、趋势）。",
  "h_desc": "创建带订阅 CTA、标签和 15 个 SEO 标签的完整描述。",
  "h_abtest": "比较 2 个标题：AI 预测哪个点击率更高。",
  "h_thumbab": "比较 2 张缩略图：Vision AI 告诉你哪张点击更多及原因。",
  "h_shorts": "把视频变成 3 个 Shorts 创意，并附上要剪辑的精确片段。",
  "h_hook": "分析你的开场并预测留存率 + 观众流失点。",
  "h_audience": "针对你的地区和领域的最佳时间、趋势、标签和主题。",
  "h_revenue": "估算你视频的 7 天观看量和 AdSense 收入。",
  "h_channel": "真实频道数据 + 健康分和 AI 建议。",
  "h_comments": "总结评论情绪和需求，并建议回复。",
  "h_ideas": "为你的领域建议 10 个高潜力视频创意。",
  "desc_section": "完整描述",
  "desc_intro": "标题 + 领域 + 地区 → 带订阅 CTA、标签和标记的描述。",
  "desc_title": "视频标题",
  "desc_title_ph": "你的视频标题…",
  "desc_run": "生成完整描述",
  "desc_need": "请先输入标题",
  "desc_ready": "✅ 可粘贴的描述",
  "desc_copy": "复制描述",
  "desc_tags": "🏷️ SEO 标签",
  "desc_copy_tags": "复制标签",
  "chap_section": "章节",
  "chap_intro": "生成带时间戳的章节（来自字幕）以粘贴到描述中。",
  "chap_run": "生成章节",
  "chap_copy": "复制章节",
  "chap_none": "此视频无可用字幕。",
  "nav_revenue": "收入",
  "rev_intro": "根据你的领域、受众和订阅者估算 7 天观看量和 AdSense 收入。",
  "rev_subs": "你的频道订阅者",
  "rev_subs_ph": "如 6m、14k、5000",
  "rev_run": "估算观看量与收入",
  "rev_views": "观看量（D+7）",
  "rev_income": "预估收入",
  "rev_factors": "📊 关键因素",
  "rev_tips": "💡 如何提升",
  "rev_disclaimer": "基于 AI 的估算 — 实际结果可能不同。",
  "nav_sponsor": "赞助",
  "h_sponsor": "估算你的赞助报价，生成品牌推介、媒体资料包和联盟创意。",
  "sp_intro": "估算你的赞助价值，并生成推介 + 媒体资料包以拿下合作。",
  "sp_subs_ph": "订阅者（如 6m、14k）",
  "sp_views_ph": "每视频平均观看（如 50k）",
  "sp_run": "生成我的赞助资料包",
  "sp_rate": "预估赞助报价（每视频）",
  "sp_pitch": "✉️ 品牌推介信息",
  "sp_copy_pitch": "复制推介",
  "sp_mediakit": "📋 媒体资料包（卖点）",
  "sp_brands": "🏢 合适的品牌",
  "sp_affiliate": "🔗 联盟创意",
  "sp_disclaimer": "AI 估算 — 请根据你的真实互动进行谈判。",
  "nav_trends": "趋势",
  "h_trends": "检测你领域中正在爆发的内容（真实近期视频）+ AI 分析。",
  "tre_intro": "你领域里现在最火的：爆发的视频 + 上升的趋势和关键词。",
  "tre_run": "检测趋势",
  "tre_need": "请先选择一个领域",
  "tre_trends": "🔥 当前趋势",
  "tre_keywords": "📈 上升关键词",
  "tre_advice": "💡 如何借势",
  "tre_hot": "🚀 爆发视频（近期）",
  "tre_none": "未发现趋势。请尝试更宽泛的领域。",
  "nav_planner": "规划器",
  "h_planner": "为你的领域创建 7 天日历，帮助稳定发布。",
  "plan_intro": "生成 7 天计划：每天发什么 + 最佳时间段。",
  "plan_freq": "频率（可选）",
  "plan_run": "生成我的 7 天计划",
  "tr_section": "本地化 / 翻译",
  "h_translate": "将你的标题、描述和标签翻译并适配为另一种语言。",
  "tr_intro": "将标题 + 描述 + 标签翻译成一种语言，触达全球受众。",
  "tr_run": "翻译",
  "tr_title": "已翻译标题",
  "tr_desc": "已翻译描述",
  "tr_copy": "复制翻译",
  "cp_section": "社区帖子",
  "h_community": "为社区标签页生成投票、问题和预告。",
  "cp_intro": "生成 5 条帖子（投票、问题、预告），在视频之间吸引受众。",
  "cp_run": "生成 5 条帖子",
  "sc_section": "完整脚本",
  "h_script": "根据一个主题写出结构化脚本（钩子、段落、CTA）。",
  "sc_intro": "给一个主题：AI 写出完整脚本（钩子、开场、段落、CTA、结尾）。",
  "sc_topic_ph": "视频主题…",
  "sc_dur": "时长",
  "sc_run": "撰写脚本",
  "sc_need": "请先输入一个主题",
  "sc_hook": "钩子（前 5 秒）",
  "sc_copy": "复制脚本",
  "pc_section": "标题 + 缩略图检查",
  "h_pair": "检查你的标题和缩略图是否互补，并在电视和手机上可读。",
  "pc_intro": "AI 检查你的标题和缩略图是否互补（不重复）及其可读性。",
  "pc_run": "检查这对组合",
  "pc_complement": "互补",
  "pc_issues": "⚠️ 问题",
  "pc_tips": "✅ 提示",
  "pl_section": "播放列表优化器",
  "h_playlists": "将你的视频分组为优化的播放列表以提升会话时长。",
  "pl_intro": "AI 将你的视频分组为优化的播放列表（更多观看时长）。",
  "pl_run": "优化我的播放列表",
  "au_section": "一键完整审计",
  "h_audit": "一次性运行 SEO + 缩略图 + 标题，并给出优先级行动计划。",
  "au_run": "运行完整审计",
  "au_global": "视频综合得分",
  "au_plan": "🎯 优先行动计划",
  "ob_title": "欢迎使用 VidSpark AI！",
  "ob_sub": "24 个优化视频的 AI 工具。以下是要点：",
  "ob_audit": "一键完整审计",
  "ob_title2": "标题的实时点击率得分",
  "ob_thumb": "比较 2 张缩略图",
  "ob_shorts": "Shorts 创意 + 要剪辑的片段",
  "ob_sponsor": "估算你的赞助收入",
  "ob_btn": "开始吧 🚀",
  "nav_channel": "频道",
  "chan_intro": "频道仪表盘：真实数据 + 健康分和 AI 建议。",
  "chan_run": "分析我的频道",
  "chan_subs": "订阅者",
  "chan_views": "总观看量",
  "chan_vids": "视频",
  "chan_avg": "平均观看",
  "chan_eng": "互动率",
  "chan_freq": "频率",
  "chan_ai_loading": "AI 诊断进行中…",
  "chan_ai_fail": "AI 诊断不可用",
  "chan_health": "健康分",
  "chan_strengths": "✅ 优势",
  "chan_weak": "⚠️ 弱点",
  "chan_reco": "💡 建议",
  "nav_comments": "评论",
  "com_intro": "AI 阅读评论：情绪、受众需求、视频创意和建议回复。",
  "com_run": "分析评论",
  "com_none": "此视频未找到评论。",
  "com_loading": "💬 正在读取并分析评论…",
  "com_sentiment": "整体情绪",
  "com_pos": "正面",
  "com_neu": "中性",
  "com_neg": "负面",
  "com_requests": "🙋 受众需求",
  "com_ideas": "💡 下一个视频创意",
  "com_replies": "✍️ 建议回复",
  "com_copy": "复制",
  "nav_ideas": "创意",
  "idea_intro": "选择你的领域、地区和可选主题：AI 建议 10 个高潜力视频创意。",
  "idea_topic_ph": "主题或关键词（可选）…",
  "idea_run": "生成 10 个创意",
  "idea_copy": "复制标题",
  "kw_opportunity": "机会得分",
  "kw_difficulty": "难度",
  "kw_demand": "需求",
  "kw_trend": "趋势",
  "kw_best": "🎯 值得瞄准的关键词",
  "kw_competition": "竞争",
  "seo_tab_analyse": "📊 分析",
  "seo_tab_optim": "🎯 优化",
  "seo_tab_kw": "🔑 关键词",
  "seo_tab_rec_kw": "推荐关键词",
  "seo_tab_issues": "问题",
  "seo_all_ok": "所有标准均已通过！",
  "example_label": "示例：",
  "recommendation_label": "建议：",
  "impact_pos_num": "正面影响 预估点击率 +8%",
  "impact_neg_num": "添加数字可使点击率提升 15–40%",
  "viral_pos_hook": "标题开头有点击率钩子",
  "viral_pos_num": "标题含数字",
  "viral_pos_em": "含情绪词",
  "viral_pos_desc": "描述足够长",
  "viral_pos_len": "标题长度最佳",
  "viral_neg_hook": "无点击率钩子 — 在开头加一个问题或数字",
  "viral_neg_num": "无数字 — 含数字的标题点击率 +40%",
  "viral_neg_em": "无情绪词 — 加一个有力词",
  "viral_neg_desc_tpl": "描述过短（N 字符）— 目标 500+",
  "viral_neg_len_short": "标题过短",
  "viral_neg_len_long": "标题过长",
  "viral_potential_title": "爆款潜力得分",
  "btn_viral_ai": "✨ 爆款 AI 分析"
 },
 "tr": {
  "nav_abtest": "A/B Testi",
  "abtest_intro": "İki başlığı karşılaştırın: Yapay zeka hangisinin daha çok tıklanacağını tahmin eder.",
  "abtest_a": "Başlık A",
  "abtest_b": "Başlık B",
  "abtest_run": "⚔️ Başlıkları karşılaştır",
  "abtest_winner": "Kazanan",
  "abtest_verdict": "YZ Kararı",
  "abtest_improved": "💡 Önerilen başlık (daha da iyi)",
  "abtest_ctr": "Tahmini TO",
  "abtest_confidence": "Güven",
  "abtest_use": "Bu başlığı kullan",
  "thumbab_title": "Küçük Resim A/B",
  "thumbab_intro": "2 küçük resmi karşılaştırın: Vision YZ hangisinin daha çok TO aldığını ve nedenini söyler.",
  "thumbab_a": "Küçük resim A",
  "thumbab_b": "Küçük resim B",
  "thumbab_run": "📸 Küçük resimleri karşılaştır",
  "thumbab_tips": "💡 Kazananı iyileştirmek için",
  "thumbab_need2": "Önce 2 görsel seçin",
  "thumbab_prompt_label": "🎨 İyileştirilmiş küçük resmi oluşturmak için ayrıntılı komut:",
  "thumbab_prompt_copy": "Komutu kopyala",
  "thumbab_prompt_hint": "Bu komutu bir görsel YZ'ye (Midjourney, DALL·E, ChatGPT, Leonardo…) yapıştırarak küçük resmini oluştur.",
  "nav_shorts": "Shorts",
  "shorts_intro": "Bu videoyu viral Shorts fikirlerine dönüştür (başlık, kanca, senaryo, etiketler).",
  "shorts_generate": "🎬 Shorts oluştur",
  "shorts_hook": "Kanca (ilk 3 sn)",
  "shorts_script": "Senaryo",
  "shorts_duration": "Süre",
  "shorts_copy": "Senaryoyu kopyala",
  "shorts_summary": "Özet",
  "shorts_clips": "✂️ Kesilecek klipler",
  "shorts_estimated": "tahmini",
  "shorts_real": "altyazılara göre",
  "live_stats_title": "Gerçek YouTube istatistikleri",
  "live_stats_btn": "Gerçek verileri yükle (görüntülenme/saat, etiketler…)",
  "audit_title": "Kanal denetimi",
  "audit_btn": "Bu kanalı denetle",
  "thumb_ai_title": "YZ küçük resim analizi",
  "thumb_ai_btn": "Küçük resmimi analiz et (YZ)",
  "thumb_ideas_title": "Küçük resim konseptleri oluştur",
  "thumb_ideas_intro": "Başlığına dayalı 3 konsept (metin, renkler, düzen, yüz), uygulamaya hazır.",
  "thumb_ideas_btn": "3 konsept oluştur",
  "thumb_ideas_loading": "Konseptler oluşturuluyor…",
  "thumb_ideas_concept": "Konsept",
  "thumb_ideas_emotion": "Duygu",
  "thumb_ideas_text": "Metin",
  "thumb_ideas_focal": "Odak noktası",
  "thumb_ideas_face": "Yüz",
  "thumb_ideas_bg": "Arka plan",
  "thumb_ideas_why": "Neden",
  "thumb_ideas_copy": "Brifingi kopyala",
  "thumb_ideas_locked_sub": "3 konseptin tümünü açmak için Pro'ya yükselt",
  "thumb_ideas_niche_ph": "Niş (isteğe bağlı, örn. yemek, oyun)",
  "thumb_gen_btn": "🖼️ Arka plan oluştur",
  "thumb_gen_loading": "Arka plan oluşturuluyor…",
  "thumb_gen_overlay_note": "YZ ile oluşturulan arka plan + üzerine eklediğin metin (görsel YZ metni iyi yazamaz, özellikle Arapça).",
  "thumb_gen_text_ph": "Görseldeki başlık metni…",
  "thumb_gen_download": "Görseli indir",
  "thumb_gen_downloaded": "Görsel indirildi",
  "thumb_gen_drag_note": "2 satır: metnini yaz, her satırı sürükle, renk/boyut/yazı tipi seç, sonra indir.",
  "thumb_gen_line": "Satır",
  "thumb_gen_color": "Renk",
  "thumb_gen_font": "Yazı tipi",
  "thumb_gen_size": "Boyut",
  "real_comp_title": "Gerçek rakipler",
  "real_comp_btn": "Patlayan gerçek videoları gör",
  "keywords_title": "Anahtar kelime araştırması",
  "keywords_ph": "örn. tavuk tarifi",
  "title_types": "Başlık türleri",
  "result_label": "Sonuç",
  "hook_title": "Kanca Analizörü",
  "hook_intro": "Intro senaryonu yapıştır (ilk 15-30 sn): YZ tutmayı ve izleyicilerin nerede ayrıldığını tahmin eder.",
  "hook_ph": "Intro metnini buraya yapıştır…",
  "hook_run": "Tutmayı analiz et",
  "hook_need": "En azından intronu yapıştır",
  "hook_retention": "Tahmini tutma",
  "hook_score_label": "Kanca puanı",
  "hook_drops": "⚠️ Ayrılma noktaları",
  "hook_fixes": "✅ Düzeltmeler",
  "hook_rewrite": "💡 Yeniden yazılmış intro (daha iyi)",
  "nav_region": "Bölge",
  "audience_intro": "Hedefini (dünya geneli, bölge veya ülke) ve dili seç: YZ en iyi saatleri, trendleri, etiketleri ve konuları verir.",
  "audience_target": "Hedef (ülke / bölge / dünya geneli)",
  "audience_target_ph": "örn. Cezayir, MENA, Fransa, Dünya geneli…",
  "audience_worldwide": "Dünya geneli",
  "audience_niche": "Niş / kanal tarzı",
  "audience_niche_ph": "örn. Oyun, Yemek, Tek, Futbol…",
  "audience_lang": "İçerik dili",
  "audience_run": "Bu kitle için optimize et",
  "audience_times": "📅 En iyi paylaşım saatleri",
  "audience_trends": "📈 Trendler ve formatlar",
  "audience_hashtags": "🏷️ Yerelleştirilmiş etiketler",
  "audience_topics": "💡 Konu fikirleri",
  "audience_tips": "🎯 İpuçları",
  "titles_section": "YZ Başlıkları",
  "td_title": "Başlık Doktoru",
  "td_run": "Derin YZ teşhisi",
  "td_need": "Önce bir başlık yaz",
  "td_len": "Uzunluk",
  "td_num": "Sayı",
  "td_emotion": "Güçlü kelime",
  "td_hook": "Kanca",
  "td_punct": "Noktalama",
  "td_ai_score": "TO puanı",
  "td_missing": "⚠️ Eksik olan",
  "td_improved": "💡 İyileştirilmiş başlık",
  "td_tips": "✅ İpuçları",
  "tdh_len": "İdeal 40-70 karakter: YouTube tarafından kesilmeden yeterince açıklayıcı.",
  "tdh_num": "Bir sayı başlığı somutlaştırır (örn. 5 ipucu, 2024) ve dikkat çeker.",
  "tdh_emotion": "Güçlü bir kelime (inanılmaz, sır, ücretsiz, şok edici…) tıklamayı tetikler.",
  "tdh_hook": "Baştaki bir kanca (Nasıl, Neden, bir soru…) merak uyandırır.",
  "tdh_punct": "Bir ? veya ! duygu katar ve tıklama isteği yaratır.",
  "h_titledoctor": "Başlığını canlı puanlar ve daha çok tıklama için optimize bir sürüm önerir.",
  "h_titles": "5 optimize başlık çeşidi üretir (SEO, TO, viral, Shorts, trend).",
  "h_desc": "Abone CTA'sı, etiketler ve 15 SEO etiketiyle tam bir açıklama oluşturur.",
  "h_abtest": "2 başlığı karşılaştırır: YZ hangisinin daha çok tıklanacağını tahmin eder.",
  "h_thumbab": "2 küçük resmi karşılaştırır: Vision YZ hangisinin daha çok tıklandığını ve nedenini söyler.",
  "h_shorts": "Videoyu kesilecek tam kliplerle 3 Shorts fikrine dönüştürür.",
  "h_hook": "Introyu analiz eder ve tutmayı + izleyicilerin nerede ayrıldığını tahmin eder.",
  "h_audience": "Bölgen ve nişin için en iyi saatler, trendler, etiketler ve konular.",
  "h_revenue": "Videonun 7 günlük görüntülenmesini ve AdSense gelirini tahmin eder.",
  "h_channel": "Gerçek kanal istatistikleri + sağlık puanı ve YZ önerileri.",
  "h_comments": "Yorum duygusunu ve istekleri özetler, yanıtlar önerir.",
  "h_ideas": "Nişine uygun 10 yüksek potansiyelli video fikri önerir.",
  "desc_section": "Tam açıklama",
  "desc_intro": "Başlık + niş + bölge → abone CTA'sı, etiketler ve etiketlerle açıklama.",
  "desc_title": "Video başlığı",
  "desc_title_ph": "Video başlığın…",
  "desc_run": "Tam açıklama oluştur",
  "desc_need": "Önce bir başlık gir",
  "desc_ready": "✅ Yapıştırmaya hazır açıklama",
  "desc_copy": "Açıklamayı kopyala",
  "desc_tags": "🏷️ SEO etiketleri",
  "desc_copy_tags": "Etiketleri kopyala",
  "chap_section": "Bölümler",
  "chap_intro": "Açıklamana yapıştırmak için zaman damgalı bölümler (altyazılardan) oluştur.",
  "chap_run": "Bölümleri oluştur",
  "chap_copy": "Bölümleri kopyala",
  "chap_none": "Bu video için altyazı yok.",
  "nav_revenue": "Gelir",
  "rev_intro": "Nişine, kitlene ve abonelerine göre 7 günlük görüntülenme ve AdSense gelirini tahmin et.",
  "rev_subs": "Kanal abonelerin",
  "rev_subs_ph": "örn. 6m, 14k, 5000",
  "rev_run": "Görüntülenme ve geliri tahmin et",
  "rev_views": "Görüntülenme (G+7)",
  "rev_income": "Tahmini gelir",
  "rev_factors": "📊 Anahtar faktörler",
  "rev_tips": "💡 Artırmak için",
  "rev_disclaimer": "YZ tabanlı tahmin — gerçek sonuçlar değişebilir.",
  "nav_sponsor": "Sponsor",
  "h_sponsor": "Sponsorluk ücretini tahmin eder, marka sunumu, medya kiti ve ortaklık fikirleri üretir.",
  "sp_intro": "Sponsorluk değerini tahmin et ve anlaşma kapatmak için sunum + medya kiti oluştur.",
  "sp_subs_ph": "Aboneler (örn. 6m, 14k)",
  "sp_views_ph": "Video başına ort. görüntülenme (örn. 50k)",
  "sp_run": "Sponsor kitimi oluştur",
  "sp_rate": "Tahmini sponsorluk ücreti (video başına)",
  "sp_pitch": "✉️ Marka sunum mesajı",
  "sp_copy_pitch": "Sunumu kopyala",
  "sp_mediakit": "📋 Medya kiti (satış noktaları)",
  "sp_brands": "🏢 Uygun markalar",
  "sp_affiliate": "🔗 Ortaklık fikirleri",
  "sp_disclaimer": "YZ tahmini — gerçek etkileşimine göre pazarlık et.",
  "nav_trends": "Trendler",
  "h_trends": "Nişinde şu anda patlayanları algılar (gerçek güncel videolar) + YZ analizi.",
  "tre_intro": "Nişinde ŞU AN gündemde olan: patlayan videolar + yükselen trendler ve anahtar kelimeler.",
  "tre_run": "Trendleri algıla",
  "tre_need": "Önce bir niş seç",
  "tre_trends": "🔥 Güncel trendler",
  "tre_keywords": "📈 Yükselen anahtar kelimeler",
  "tre_advice": "💡 Nasıl yararlanılır",
  "tre_hot": "🚀 Patlayan videolar (güncel)",
  "tre_none": "Trend bulunamadı. Daha geniş bir niş dene.",
  "nav_planner": "Planlayıcı",
  "h_planner": "Düzenli paylaşım için nişine uygun 7 günlük takvim oluşturur.",
  "plan_intro": "7 günlük plan oluştur: her gün ne paylaşılacak + en iyi zaman dilimi.",
  "plan_freq": "Sıklık (isteğe bağlı)",
  "plan_run": "7 günlük planımı oluştur",
  "tr_section": "Yerelleştirme / Çeviri",
  "h_translate": "Başlığını, açıklamanı ve etiketlerini başka bir dile çevirir ve uyarlar.",
  "tr_intro": "Küresel kitleye ulaşmak için başlık + açıklama + etiketleri bir dile çevir.",
  "tr_run": "Çevir",
  "tr_title": "Çevrilen başlık",
  "tr_desc": "Çevrilen açıklama",
  "tr_copy": "Çeviriyi kopyala",
  "cp_section": "Topluluk gönderileri",
  "h_community": "Topluluk sekmesi için anketler, sorular ve teaser'lar üretir.",
  "cp_intro": "Videolar arasında kitleni etkilemek için 5 gönderi (anket, soru, teaser) üret.",
  "cp_run": "5 gönderi üret",
  "sc_section": "Tam senaryo",
  "h_script": "Bir konudan yapılandırılmış senaryo (kanca, bölümler, CTA) yazar.",
  "sc_intro": "Bir konu ver: YZ tam senaryoyu yazar (kanca, intro, bölümler, CTA, kapanış).",
  "sc_topic_ph": "Video konusu…",
  "sc_dur": "Süre",
  "sc_run": "Senaryoyu yaz",
  "sc_need": "Önce bir konu gir",
  "sc_hook": "Kanca (ilk 5 sn)",
  "sc_copy": "Senaryoyu kopyala",
  "pc_section": "Başlık + küçük resim kontrolü",
  "h_pair": "Başlık ve küçük resmin birbirini tamamlayıp TV ve mobilde okunaklı olduğunu kontrol eder.",
  "pc_intro": "YZ, başlık ve küçük resmin birbirini tamamladığını (tekrar olmadan) ve okunabilirliğini kontrol eder.",
  "pc_run": "İkiliyi kontrol et",
  "pc_complement": "Tamamlayıcı",
  "pc_issues": "⚠️ Sorunlar",
  "pc_tips": "✅ İpuçları",
  "pl_section": "Oynatma listesi optimizasyonu",
  "h_playlists": "Videolarını oturum süresi için optimize edilmiş oynatma listelerine gruplar.",
  "pl_intro": "YZ videolarını optimize edilmiş oynatma listelerine gruplar (daha çok izlenme süresi).",
  "pl_run": "Oynatma listelerimi optimize et",
  "au_section": "Tek tıkla tam denetim",
  "h_audit": "SEO + Küçük resim + Başlığı tek seferde çalıştırır ve öncelikli eylem planı verir.",
  "au_run": "Tam denetimi çalıştır",
  "au_global": "Genel video puanı",
  "au_plan": "🎯 Öncelikli eylem planı",
  "ob_title": "VidSpark AI'ya hoş geldin!",
  "ob_sub": "Videolarını optimize etmek için 24 YZ aracı. İşte temel olanlar:",
  "ob_audit": "tek tıkla tam denetim",
  "ob_title2": "başlığın için canlı TO puanı",
  "ob_thumb": "2 küçük resmi karşılaştır",
  "ob_shorts": "Shorts fikirleri + kesilecek klipler",
  "ob_sponsor": "sponsorluk gelirini tahmin et",
  "ob_btn": "Hadi başlayalım 🚀",
  "nav_channel": "Kanal",
  "chan_intro": "Kanal panosu: gerçek istatistikler + sağlık puanı ve YZ önerileri.",
  "chan_run": "Kanalımı analiz et",
  "chan_subs": "Aboneler",
  "chan_views": "Toplam görüntülenme",
  "chan_vids": "Video",
  "chan_avg": "Ort. görüntülenme",
  "chan_eng": "Etkileşim",
  "chan_freq": "Sıklık",
  "chan_ai_loading": "YZ teşhisi sürüyor…",
  "chan_ai_fail": "YZ teşhisi kullanılamıyor",
  "chan_health": "Sağlık puanı",
  "chan_strengths": "✅ Güçlü yönler",
  "chan_weak": "⚠️ Zayıf yönler",
  "chan_reco": "💡 Öneriler",
  "nav_comments": "Yorumlar",
  "com_intro": "YZ yorumları okur: duygu, kitle istekleri, video fikirleri ve önerilen yanıtlar.",
  "com_run": "Yorumları analiz et",
  "com_none": "Bu videoda yorum bulunamadı.",
  "com_loading": "💬 Yorumlar okunuyor ve analiz ediliyor…",
  "com_sentiment": "Genel duygu",
  "com_pos": "Olumlu",
  "com_neu": "Nötr",
  "com_neg": "Olumsuz",
  "com_requests": "🙋 Kitle istekleri",
  "com_ideas": "💡 Sonraki video fikirleri",
  "com_replies": "✍️ Önerilen yanıtlar",
  "com_copy": "Kopyala",
  "nav_ideas": "Fikirler",
  "idea_intro": "Nişini, bölgeni ve isteğe bağlı bir konu seç: YZ 10 yüksek potansiyelli video fikri önerir.",
  "idea_topic_ph": "Konu veya anahtar kelime (isteğe bağlı)…",
  "idea_run": "10 fikir üret",
  "idea_copy": "Başlığı kopyala",
  "kw_opportunity": "Fırsat puanı",
  "kw_difficulty": "Zorluk",
  "kw_demand": "Talep",
  "kw_trend": "Trend",
  "kw_best": "🎯 Hedeflenecek anahtar kelimeler",
  "kw_competition": "Rekabet",
  "seo_tab_analyse": "📊 Analiz",
  "seo_tab_optim": "🎯 Optimizasyon",
  "seo_tab_kw": "🔑 Anahtar kelimeler",
  "seo_tab_rec_kw": "Önerilen anahtar kelimeler",
  "seo_tab_issues": "sorunlar",
  "seo_all_ok": "Tüm kriterler sağlandı!",
  "example_label": "Örnek:",
  "recommendation_label": "ÖNERİ:",
  "impact_pos_num": "Olumlu etki +8% tahmini TO",
  "impact_neg_num": "Bir sayı eklemek TO'yu %15–40 artırabilir",
  "viral_pos_hook": "Başlık başında TO kancası",
  "viral_pos_num": "Başlıkta sayı",
  "viral_pos_em": "Duygusal kelime mevcut",
  "viral_pos_desc": "Açıklama yeterince uzun",
  "viral_pos_len": "Optimal başlık uzunluğu",
  "viral_neg_hook": "TO kancası yok — başa bir soru veya sayı ekle",
  "viral_neg_num": "Sayı yok — sayılı başlıklar +%40 TO alır",
  "viral_neg_em": "Duygusal kelime yok — güçlü bir kelime ekle",
  "viral_neg_desc_tpl": "Kısa açıklama (N karakter) — 500+ hedefle",
  "viral_neg_len_short": "Başlık çok kısa",
  "viral_neg_len_long": "Başlık çok uzun",
  "viral_potential_title": "Viral potansiyel puanı",
  "btn_viral_ai": "✨ Viral YZ Analizi"
 },
 "nl": {
  "nav_abtest": "A/B-test",
  "abtest_intro": "Vergelijk twee titels: de AI voorspelt welke de meeste klikken krijgt.",
  "abtest_a": "Titel A",
  "abtest_b": "Titel B",
  "abtest_run": "⚔️ Titels vergelijken",
  "abtest_winner": "Winnaar",
  "abtest_verdict": "AI-oordeel",
  "abtest_improved": "💡 Voorgestelde titel (nog beter)",
  "abtest_ctr": "Gesch. CTR",
  "abtest_confidence": "Zekerheid",
  "abtest_use": "Deze titel gebruiken",
  "thumbab_title": "Thumbnail A/B",
  "thumbab_intro": "Vergelijk 2 thumbnails: Vision AI zegt welke meer CTR krijgt en waarom.",
  "thumbab_a": "Thumbnail A",
  "thumbab_b": "Thumbnail B",
  "thumbab_run": "📸 Thumbnails vergelijken",
  "thumbab_tips": "💡 Om de winnaar te verbeteren",
  "thumbab_need2": "Kies eerst 2 afbeeldingen",
  "thumbab_prompt_label": "🎨 Gedetailleerde prompt om de verbeterde thumbnail te maken:",
  "thumbab_prompt_copy": "Prompt kopiëren",
  "thumbab_prompt_hint": "Plak deze prompt in een afbeeldings-AI (Midjourney, DALL·E, ChatGPT, Leonardo…) om je thumbnail te genereren.",
  "nav_shorts": "Shorts",
  "shorts_intro": "Maak van deze video virale Shorts-ideeën (titel, hook, script, hashtags).",
  "shorts_generate": "🎬 Shorts genereren",
  "shorts_hook": "Hook (eerste 3 sec)",
  "shorts_script": "Script",
  "shorts_duration": "Duur",
  "shorts_copy": "Script kopiëren",
  "shorts_summary": "Samenvatting",
  "shorts_clips": "✂️ Te knippen clips",
  "shorts_estimated": "geschat",
  "shorts_real": "op basis van ondertitels",
  "live_stats_title": "Echte YouTube-statistieken",
  "live_stats_btn": "Echte data laden (weergaven/u, tags…)",
  "audit_title": "Kanaalaudit",
  "audit_btn": "Dit kanaal auditen",
  "thumb_ai_title": "AI-thumbnailanalyse",
  "thumb_ai_btn": "Mijn thumbnail analyseren (AI)",
  "thumb_ideas_title": "Thumbnailconcepten genereren",
  "thumb_ideas_intro": "3 concepten (tekst, kleuren, lay-out, gezicht) op basis van je titel, klaar om uit te voeren.",
  "thumb_ideas_btn": "3 concepten genereren",
  "thumb_ideas_loading": "Concepten genereren…",
  "thumb_ideas_concept": "Concept",
  "thumb_ideas_emotion": "Emotie",
  "thumb_ideas_text": "Tekst",
  "thumb_ideas_focal": "Focuspunt",
  "thumb_ideas_face": "Gezicht",
  "thumb_ideas_bg": "Achtergrond",
  "thumb_ideas_why": "Waarom",
  "thumb_ideas_copy": "Briefing kopiëren",
  "thumb_ideas_locked_sub": "Upgrade naar Pro om alle 3 concepten te ontgrendelen",
  "thumb_ideas_niche_ph": "Niche (optioneel, bijv. koken, gaming)",
  "thumb_gen_btn": "🖼️ Achtergrond genereren",
  "thumb_gen_loading": "Achtergrond genereren…",
  "thumb_gen_overlay_note": "AI-gegenereerde achtergrond + je overlay-tekst (afbeeldings-AI schrijft tekst niet goed, vooral Arabisch).",
  "thumb_gen_text_ph": "Titeltekst op de afbeelding…",
  "thumb_gen_download": "Afbeelding downloaden",
  "thumb_gen_downloaded": "Afbeelding gedownload",
  "thumb_gen_drag_note": "2 regels: typ je tekst, sleep elke regel, kies kleur/grootte/lettertype en download.",
  "thumb_gen_line": "Regel",
  "thumb_gen_color": "Kleur",
  "thumb_gen_font": "Lettertype",
  "thumb_gen_size": "Grootte",
  "real_comp_title": "Echte concurrenten",
  "real_comp_btn": "Bekijk de echte topvideo's",
  "keywords_title": "Zoekwoordonderzoek",
  "keywords_ph": "bijv. kiprecept",
  "title_types": "Titeltypes",
  "result_label": "Resultaat",
  "hook_title": "Hook-analyse",
  "hook_intro": "Plak je intro-script (eerste 15-30 sec): de AI voorspelt de retentie en waar kijkers afhaken.",
  "hook_ph": "Plak hier je introtekst…",
  "hook_run": "Retentie analyseren",
  "hook_need": "Plak ten minste je intro",
  "hook_retention": "Gesch. retentie",
  "hook_score_label": "Hook-score",
  "hook_drops": "⚠️ Afhaakpunten",
  "hook_fixes": "✅ Correcties",
  "hook_rewrite": "💡 Herschreven intro (beter)",
  "nav_region": "Regio",
  "audience_intro": "Kies je doel (wereldwijd, regio of land) en de taal: de AI geeft beste tijden, trends, hashtags en onderwerpen.",
  "audience_target": "Doel (land / regio / wereldwijd)",
  "audience_target_ph": "bijv. Algerije, MENA, Frankrijk, Wereldwijd…",
  "audience_worldwide": "Wereldwijd",
  "audience_niche": "Niche / kanaalstijl",
  "audience_niche_ph": "bijv. Gaming, Koken, Tech, Voetbal…",
  "audience_lang": "Inhoudstaal",
  "audience_run": "Optimaliseren voor dit publiek",
  "audience_times": "📅 Beste posttijden",
  "audience_trends": "📈 Trends en formats",
  "audience_hashtags": "🏷️ Gelokaliseerde hashtags",
  "audience_topics": "💡 Onderwerpideeën",
  "audience_tips": "🎯 Tips",
  "titles_section": "AI-titels",
  "td_title": "Titeldokter",
  "td_run": "Diepe AI-diagnose",
  "td_need": "Typ eerst een titel",
  "td_len": "Lengte",
  "td_num": "Getal",
  "td_emotion": "Krachtwoord",
  "td_hook": "Hook",
  "td_punct": "Interpunctie",
  "td_ai_score": "CTR-score",
  "td_missing": "⚠️ Wat ontbreekt",
  "td_improved": "💡 Verbeterde titel",
  "td_tips": "✅ Tips",
  "tdh_len": "Ideaal 40-70 tekens: beschrijvend genoeg zonder door YouTube afgekapt te worden.",
  "tdh_num": "Een getal maakt de titel concreet (bijv. 5 tips, 2024) en valt op.",
  "tdh_emotion": "Een krachtwoord (geweldig, geheim, gratis, schokkend…) lokt de klik uit.",
  "tdh_hook": "Een hook aan het begin (Hoe, Waarom, een vraag…) wekt nieuwsgierigheid.",
  "tdh_punct": "Een ? of ! voegt emotie toe en maakt zin om te klikken.",
  "h_titledoctor": "Scoort je titel live en stelt een geoptimaliseerde versie voor meer klikken voor.",
  "h_titles": "Genereert 5 geoptimaliseerde titelvarianten (SEO, CTR, viraal, Shorts, trending).",
  "h_desc": "Maakt een volledige beschrijving met abonneer-CTA, hashtags en 15 SEO-tags.",
  "h_abtest": "Vergelijkt 2 titels: de AI voorspelt welke de meeste klikken krijgt.",
  "h_thumbab": "Vergelijkt 2 thumbnails: Vision AI zegt welke meer klikken krijgt en waarom.",
  "h_shorts": "Maakt van de video 3 Shorts-ideeën met de exacte te knippen clips.",
  "h_hook": "Analyseert je intro en voorspelt de retentie + waar kijkers afhaken.",
  "h_audience": "Beste tijden, trends, hashtags en onderwerpen voor je regio en niche.",
  "h_revenue": "Schat de weergaven over 7 dagen en de AdSense-inkomsten van je video.",
  "h_channel": "Echte kanaalstatistieken + gezondheidsscore en AI-aanbevelingen.",
  "h_comments": "Vat het sentiment van reacties en verzoeken samen en stelt antwoorden voor.",
  "h_ideas": "Stelt 10 video-ideeën met hoog potentieel voor je niche voor.",
  "desc_section": "Volledige beschrijving",
  "desc_intro": "Titel + niche + regio → beschrijving met abonneer-CTA, hashtags en tags.",
  "desc_title": "Videotitel",
  "desc_title_ph": "Je videotitel…",
  "desc_run": "Volledige beschrijving genereren",
  "desc_need": "Voer eerst een titel in",
  "desc_ready": "✅ Kant-en-klare beschrijving om te plakken",
  "desc_copy": "Beschrijving kopiëren",
  "desc_tags": "🏷️ SEO-tags",
  "desc_copy_tags": "Tags kopiëren",
  "chap_section": "Hoofdstukken",
  "chap_intro": "Genereer hoofdstukken met tijdstempels (uit ondertitels) om in je beschrijving te plakken.",
  "chap_run": "Hoofdstukken genereren",
  "chap_copy": "Hoofdstukken kopiëren",
  "chap_none": "Ondertitels niet beschikbaar voor deze video.",
  "nav_revenue": "Inkomsten",
  "rev_intro": "Schat de weergaven over 7 dagen en de AdSense-inkomsten op basis van niche, publiek en abonnees.",
  "rev_subs": "Abonnees van je kanaal",
  "rev_subs_ph": "bijv. 6m, 14k, 5000",
  "rev_run": "Weergaven & inkomsten schatten",
  "rev_views": "Weergaven (D+7)",
  "rev_income": "Gesch. inkomsten",
  "rev_factors": "📊 Sleutelfactoren",
  "rev_tips": "💡 Om te verhogen",
  "rev_disclaimer": "AI-gebaseerde schatting — werkelijke resultaten kunnen variëren.",
  "nav_sponsor": "Sponsor",
  "h_sponsor": "Schat je sponsortarief, genereert een merkpitch, een mediakit en affiliate-ideeën.",
  "sp_intro": "Schat je sponsorwaarde en genereer een pitch + mediakit om deals binnen te halen.",
  "sp_subs_ph": "Abonnees (bijv. 6m, 14k)",
  "sp_views_ph": "Gem. weergaven/video (bijv. 50k)",
  "sp_run": "Mijn sponsorkit genereren",
  "sp_rate": "Geschat sponsortarief (per video)",
  "sp_pitch": "✉️ Merkpitchbericht",
  "sp_copy_pitch": "Pitch kopiëren",
  "sp_mediakit": "📋 Mediakit (verkooppunten)",
  "sp_brands": "🏢 Passende merken",
  "sp_affiliate": "🔗 Affiliate-ideeën",
  "sp_disclaimer": "AI-schatting — onderhandel op basis van je echte betrokkenheid.",
  "nav_trends": "Trends",
  "h_trends": "Detecteert wat nu explodeert in je niche (echte recente video's) + AI-analyse.",
  "tre_intro": "Wat NU hot is in je niche: explosieve video's + opkomende trends en zoekwoorden.",
  "tre_run": "Trends detecteren",
  "tre_need": "Kies eerst een niche",
  "tre_trends": "🔥 Huidige trends",
  "tre_keywords": "📈 Opkomende zoekwoorden",
  "tre_advice": "💡 Hoe je erop inspeelt",
  "tre_hot": "🚀 Explosieve video's (recent)",
  "tre_none": "Geen trends gevonden. Probeer een bredere niche.",
  "nav_planner": "Planner",
  "h_planner": "Maakt een 7-daagse kalender op maat van je niche om consistent te posten.",
  "plan_intro": "Genereer een 7-daags plan: wat elke dag te posten + het beste tijdslot.",
  "plan_freq": "Frequentie (optioneel)",
  "plan_run": "Mijn 7-daags plan genereren",
  "tr_section": "Lokalisatie / Vertaling",
  "h_translate": "Vertaalt en past je titel, beschrijving en tags aan naar een andere taal.",
  "tr_intro": "Vertaal titel + beschrijving + tags naar een taal om een wereldwijd publiek te bereiken.",
  "tr_run": "Vertalen",
  "tr_title": "Vertaalde titel",
  "tr_desc": "Vertaalde beschrijving",
  "tr_copy": "Vertaling kopiëren",
  "cp_section": "Communityposts",
  "h_community": "Genereert polls, vragen en teasers voor het Community-tabblad.",
  "cp_intro": "Genereer 5 posts (polls, vragen, teasers) om je publiek tussen video's te boeien.",
  "cp_run": "5 posts genereren",
  "sc_section": "Volledig script",
  "h_script": "Schrijft een gestructureerd script (hook, secties, CTA) vanuit een onderwerp.",
  "sc_intro": "Geef een onderwerp: de AI schrijft het volledige script (hook, intro, secties, CTA, outro).",
  "sc_topic_ph": "Video-onderwerp…",
  "sc_dur": "Duur",
  "sc_run": "Het script schrijven",
  "sc_need": "Voer eerst een onderwerp in",
  "sc_hook": "Hook (eerste 5 sec)",
  "sc_copy": "Script kopiëren",
  "pc_section": "Titel + thumbnail check",
  "h_pair": "Controleert of je titel en thumbnail elkaar aanvullen en leesbaar zijn op tv en mobiel.",
  "pc_intro": "De AI controleert of je titel en thumbnail elkaar aanvullen (geen herhaling) en hun leesbaarheid.",
  "pc_run": "Het paar controleren",
  "pc_complement": "Aanvullend",
  "pc_issues": "⚠️ Problemen",
  "pc_tips": "✅ Tips",
  "pl_section": "Afspeellijst-optimalisator",
  "h_playlists": "Groepeert je video's in geoptimaliseerde afspeellijsten voor sessieduur.",
  "pl_intro": "De AI groepeert je video's in geoptimaliseerde afspeellijsten (meer kijktijd).",
  "pl_run": "Mijn afspeellijsten optimaliseren",
  "au_section": "Volledige audit met 1 klik",
  "h_audit": "Voert SEO + Thumbnail + Titel in één keer uit en geeft een geprioriteerd actieplan.",
  "au_run": "Volledige audit uitvoeren",
  "au_global": "Totale videoscore",
  "au_plan": "🎯 Prioritair actieplan",
  "ob_title": "Welkom bij VidSpark AI!",
  "ob_sub": "24 AI-tools om je video's te optimaliseren. Dit is het belangrijkste:",
  "ob_audit": "een volledige audit met 1 klik",
  "ob_title2": "live CTR-score voor je titel",
  "ob_thumb": "2 thumbnails vergelijken",
  "ob_shorts": "Shorts-ideeën + te knippen clips",
  "ob_sponsor": "schat je sponsorinkomsten",
  "ob_btn": "We gaan ervoor 🚀",
  "nav_channel": "Kanaal",
  "chan_intro": "Kanaaldashboard: echte statistieken + gezondheidsscore en AI-aanbevelingen.",
  "chan_run": "Mijn kanaal analyseren",
  "chan_subs": "Abonnees",
  "chan_views": "Totale weergaven",
  "chan_vids": "Video's",
  "chan_avg": "Gem. weergaven",
  "chan_eng": "Betrokkenheid",
  "chan_freq": "Frequentie",
  "chan_ai_loading": "AI-diagnose bezig…",
  "chan_ai_fail": "AI-diagnose niet beschikbaar",
  "chan_health": "Gezondheidsscore",
  "chan_strengths": "✅ Sterke punten",
  "chan_weak": "⚠️ Zwakke punten",
  "chan_reco": "💡 Aanbevelingen",
  "nav_comments": "Reacties",
  "com_intro": "De AI leest de reacties: sentiment, verzoeken van het publiek, video-ideeën en voorgestelde antwoorden.",
  "com_run": "Reacties analyseren",
  "com_none": "Geen reacties gevonden bij deze video.",
  "com_loading": "💬 Reacties lezen en analyseren…",
  "com_sentiment": "Algemeen sentiment",
  "com_pos": "Positief",
  "com_neu": "Neutraal",
  "com_neg": "Negatief",
  "com_requests": "🙋 Verzoeken van het publiek",
  "com_ideas": "💡 Ideeën voor de volgende video",
  "com_replies": "✍️ Voorgestelde antwoorden",
  "com_copy": "Kopiëren",
  "nav_ideas": "Ideeën",
  "idea_intro": "Kies je niche, regio en een optioneel onderwerp: de AI stelt 10 video-ideeën met hoog potentieel voor.",
  "idea_topic_ph": "Onderwerp of zoekwoord (optioneel)…",
  "idea_run": "10 ideeën genereren",
  "idea_copy": "Titel kopiëren",
  "kw_opportunity": "Kansscore",
  "kw_difficulty": "Moeilijkheid",
  "kw_demand": "Vraag",
  "kw_trend": "Trend",
  "kw_best": "🎯 Te richten zoekwoorden",
  "kw_competition": "Concurrentie",
  "seo_tab_analyse": "📊 Analyse",
  "seo_tab_optim": "🎯 Optimalisatie",
  "seo_tab_kw": "🔑 Zoekwoorden",
  "seo_tab_rec_kw": "Aanbevolen zoekwoorden",
  "seo_tab_issues": "problemen",
  "seo_all_ok": "Alle criteria voldaan!",
  "example_label": "Voorbeeld:",
  "recommendation_label": "AANBEVELING:",
  "impact_pos_num": "Positief effect +8% geschatte CTR",
  "impact_neg_num": "Een getal toevoegen kan de CTR met 15–40% verhogen",
  "viral_pos_hook": "CTR-hook aan het begin van de titel",
  "viral_pos_num": "Getal in de titel",
  "viral_pos_em": "Emotioneel woord aanwezig",
  "viral_pos_desc": "Beschrijving lang genoeg",
  "viral_pos_len": "Optimale titellengte",
  "viral_neg_hook": "Geen CTR-hook — voeg een vraag of getal toe aan het begin",
  "viral_neg_num": "Geen getal — titels met getallen krijgen +40% CTR",
  "viral_neg_em": "Geen emotioneel woord — voeg een krachtwoord toe",
  "viral_neg_desc_tpl": "Korte beschrijving (N tekens) — streef naar 500+",
  "viral_neg_len_short": "Titel te kort",
  "viral_neg_len_long": "Titel te lang",
  "viral_potential_title": "Virale potentieelscore",
  "btn_viral_ai": "✨ Virale AI-analyse"
 }
};
Object.keys(FILL_I18N).forEach(l=>{ if(I18N[l]){ for(const k in FILL_I18N[l]){ if(!(k in I18N[l])) I18N[l][k]=FILL_I18N[l][k]; } } });

/* ── REPORT_I18N : clés du rapport complet (résumé, fixes, top10, spinners) — 14 langues ── */
const REPORT_I18N = {
 fr:{ unit_char:"car.", viral_add_num:"Ajouter un chiffre", viral_add_em:"Ajouter un mot émotionnel", viral_add_hook:"Ajouter un hook CTR", act_add_punct:"Ajouter ? ou !", desc_richness:"Richesse de la description", top10_6:"Ajouter des timestamps", top10_7:"Améliorer la miniature", top10_8:"Ajouter un visage expressif", top10_9:"Publier 14h–17h", top10_10:"Répondre aux 10 premiers commentaires", report_fix_pre:"En corrigeant", report_fix_mid:"point(s), le score peut atteindre", report_pts:"pts", report_vp:"Potentiel viral", spin_thumb_ai:"🔍 Analyse de la miniature…", spin_pair:"🔗 Analyse de la paire…", spin_trends:"🔥 Détection des tendances…", spin_channel:"📊 Analyse de la chaîne…", spin_hook:"🪝 Analyse de la rétention…" },
 en:{ unit_char:"chars", viral_add_num:"Add a number", viral_add_em:"Add an emotional word", viral_add_hook:"Add a CTR hook", act_add_punct:"Add ? or !", desc_richness:"Description richness", top10_6:"Add timestamps", top10_7:"Improve the thumbnail", top10_8:"Add an expressive face", top10_9:"Post 2–5 PM", top10_10:"Reply to the first 10 comments", report_fix_pre:"By fixing", report_fix_mid:"point(s), the score can reach", report_pts:"pts", report_vp:"Viral potential", spin_thumb_ai:"🔍 Analyzing the thumbnail…", spin_pair:"🔗 Analyzing the pair…", spin_trends:"🔥 Detecting trends…", spin_channel:"📊 Analyzing the channel…", spin_hook:"🪝 Analyzing retention…" },
 ar:{ unit_char:"حرف", viral_add_num:"أضف رقمًا", viral_add_em:"أضف كلمة عاطفية", viral_add_hook:"أضف خطّاف CTR", act_add_punct:"أضف ؟ أو !", desc_richness:"غنى الوصف", top10_6:"أضف طوابع زمنية", top10_7:"حسّن الصورة المصغّرة", top10_8:"أضف وجهًا معبّرًا", top10_9:"انشر بين 14–17", top10_10:"ردّ على أول 10 تعليقات", report_fix_pre:"بتصحيح", report_fix_mid:"نقطة، يمكن أن تصل النتيجة إلى", report_pts:"نقطة", report_vp:"الإمكانات الفيروسية", spin_thumb_ai:"🔍 جارٍ تحليل الصورة المصغّرة…", spin_pair:"🔗 جارٍ تحليل الثنائي…", spin_trends:"🔥 جارٍ اكتشاف الاتجاهات…", spin_channel:"📊 جارٍ تحليل القناة…", spin_hook:"🪝 جارٍ تحليل الاحتفاظ…" },
 es:{ unit_char:"car.", viral_add_num:"Añadir un número", viral_add_em:"Añadir una palabra emocional", viral_add_hook:"Añadir un gancho de CTR", act_add_punct:"Añadir ? o !", desc_richness:"Riqueza de la descripción", top10_6:"Añadir marcas de tiempo", top10_7:"Mejorar la miniatura", top10_8:"Añadir un rostro expresivo", top10_9:"Publicar 14–17 h", top10_10:"Responder a los 10 primeros comentarios", report_fix_pre:"Corrigiendo", report_fix_mid:"punto(s), la puntuación puede llegar a", report_pts:"pts", report_vp:"Potencial viral", spin_thumb_ai:"🔍 Analizando la miniatura…", spin_pair:"🔗 Analizando el par…", spin_trends:"🔥 Detectando tendencias…", spin_channel:"📊 Analizando el canal…", spin_hook:"🪝 Analizando la retención…" },
 pt:{ unit_char:"car.", viral_add_num:"Adicionar um número", viral_add_em:"Adicionar uma palavra emocional", viral_add_hook:"Adicionar um gancho de CTR", act_add_punct:"Adicionar ? ou !", desc_richness:"Riqueza da descrição", top10_6:"Adicionar timestamps", top10_7:"Melhorar a miniatura", top10_8:"Adicionar um rosto expressivo", top10_9:"Publicar 14–17h", top10_10:"Responder aos 10 primeiros comentários", report_fix_pre:"Corrigindo", report_fix_mid:"ponto(s), a pontuação pode chegar a", report_pts:"pts", report_vp:"Potencial viral", spin_thumb_ai:"🔍 Analisando a miniatura…", spin_pair:"🔗 Analisando o par…", spin_trends:"🔥 Detectando tendências…", spin_channel:"📊 Analisando o canal…", spin_hook:"🪝 Analisando a retenção…" },
 de:{ unit_char:"Z.", viral_add_num:"Eine Zahl hinzufügen", viral_add_em:"Ein emotionales Wort hinzufügen", viral_add_hook:"Einen CTR-Hook hinzufügen", act_add_punct:"? oder ! hinzufügen", desc_richness:"Beschreibungsumfang", top10_6:"Zeitstempel hinzufügen", top10_7:"Thumbnail verbessern", top10_8:"Ein ausdrucksstarkes Gesicht hinzufügen", top10_9:"14–17 Uhr posten", top10_10:"Auf die ersten 10 Kommentare antworten", report_fix_pre:"Durch das Beheben von", report_fix_mid:"Punkt(en) kann der Score erreichen", report_pts:"Pkt.", report_vp:"Virales Potenzial", spin_thumb_ai:"🔍 Thumbnail wird analysiert…", spin_pair:"🔗 Paar wird analysiert…", spin_trends:"🔥 Trends werden erkannt…", spin_channel:"📊 Kanal wird analysiert…", spin_hook:"🪝 Bindung wird analysiert…" },
 it:{ unit_char:"car.", viral_add_num:"Aggiungere un numero", viral_add_em:"Aggiungere una parola emozionale", viral_add_hook:"Aggiungere un hook CTR", act_add_punct:"Aggiungere ? o !", desc_richness:"Ricchezza della descrizione", top10_6:"Aggiungere timestamp", top10_7:"Migliorare la miniatura", top10_8:"Aggiungere un volto espressivo", top10_9:"Pubblicare 14–17", top10_10:"Rispondere ai primi 10 commenti", report_fix_pre:"Correggendo", report_fix_mid:"punto/i, il punteggio può raggiungere", report_pts:"pt", report_vp:"Potenziale virale", spin_thumb_ai:"🔍 Analisi della miniatura…", spin_pair:"🔗 Analisi della coppia…", spin_trends:"🔥 Rilevamento dei trend…", spin_channel:"📊 Analisi del canale…", spin_hook:"🪝 Analisi della retention…" },
 ru:{ unit_char:"симв.", viral_add_num:"Добавить число", viral_add_em:"Добавить эмоциональное слово", viral_add_hook:"Добавить CTR-хук", act_add_punct:"Добавить ? или !", desc_richness:"Насыщенность описания", top10_6:"Добавить таймкоды", top10_7:"Улучшить превью", top10_8:"Добавить выразительное лицо", top10_9:"Публиковать 14–17", top10_10:"Ответить на первые 10 комментариев", report_fix_pre:"Исправив", report_fix_mid:"пункт(ов), оценка может достичь", report_pts:"балл.", report_vp:"Вирусный потенциал", spin_thumb_ai:"🔍 Анализ превью…", spin_pair:"🔗 Анализ пары…", spin_trends:"🔥 Обнаружение трендов…", spin_channel:"📊 Анализ канала…", spin_hook:"🪝 Анализ удержания…" },
 ja:{ unit_char:"文字", viral_add_num:"数字を追加", viral_add_em:"感情的な言葉を追加", viral_add_hook:"CTRフックを追加", act_add_punct:"? または ! を追加", desc_richness:"説明の充実度", top10_6:"タイムスタンプを追加", top10_7:"サムネイルを改善", top10_8:"表情豊かな顔を追加", top10_9:"14〜17時に投稿", top10_10:"最初の10件のコメントに返信", report_fix_pre:"修正すると", report_fix_mid:"点で、スコアは次に到達できます", report_pts:"点", report_vp:"バイラル潜在力", spin_thumb_ai:"🔍 サムネイルを分析中…", spin_pair:"🔗 ペアを分析中…", spin_trends:"🔥 トレンドを検出中…", spin_channel:"📊 チャンネルを分析中…", spin_hook:"🪝 維持率を分析中…" },
 ko:{ unit_char:"자", viral_add_num:"숫자 추가", viral_add_em:"감정 단어 추가", viral_add_hook:"CTR 후크 추가", act_add_punct:"? 또는 ! 추가", desc_richness:"설명 풍부도", top10_6:"타임스탬프 추가", top10_7:"썸네일 개선", top10_8:"표정이 풍부한 얼굴 추가", top10_9:"오후 2~5시 게시", top10_10:"첫 10개 댓글에 답글", report_fix_pre:"수정하면", report_fix_mid:"개 항목으로 점수가 도달할 수 있습니다", report_pts:"점", report_vp:"바이럴 잠재력", spin_thumb_ai:"🔍 썸네일 분석 중…", spin_pair:"🔗 쌍 분석 중…", spin_trends:"🔥 트렌드 감지 중…", spin_channel:"📊 채널 분석 중…", spin_hook:"🪝 시청 지속률 분석 중…" },
 hi:{ unit_char:"अक्षर", viral_add_num:"एक संख्या जोड़ें", viral_add_em:"एक भावनात्मक शब्द जोड़ें", viral_add_hook:"एक CTR हुक जोड़ें", act_add_punct:"? या ! जोड़ें", desc_richness:"विवरण की समृद्धि", top10_6:"टाइमस्टैम्प जोड़ें", top10_7:"थंबनेल सुधारें", top10_8:"एक भावपूर्ण चेहरा जोड़ें", top10_9:"दोपहर 2–5 बजे पोस्ट करें", top10_10:"पहले 10 कमेंट का जवाब दें", report_fix_pre:"सुधारने पर", report_fix_mid:"बिंदु, स्कोर पहुँच सकता है", report_pts:"अंक", report_vp:"वायरल संभावना", spin_thumb_ai:"🔍 थंबनेल विश्लेषण हो रहा है…", spin_pair:"🔗 जोड़ी विश्लेषण हो रहा है…", spin_trends:"🔥 ट्रेंड पहचाने जा रहे हैं…", spin_channel:"📊 चैनल विश्लेषण हो रहा है…", spin_hook:"🪝 रिटेंशन विश्लेषण हो रहा है…" },
 zh:{ unit_char:"字符", viral_add_num:"添加一个数字", viral_add_em:"添加一个情绪词", viral_add_hook:"添加一个点击率钩子", act_add_punct:"添加 ? 或 !", desc_richness:"描述丰富度", top10_6:"添加时间戳", top10_7:"改进缩略图", top10_8:"添加一张有表情的脸", top10_9:"在下午2–5点发布", top10_10:"回复前10条评论", report_fix_pre:"修正", report_fix_mid:"个要点后，得分可达到", report_pts:"分", report_vp:"爆款潜力", spin_thumb_ai:"🔍 正在分析缩略图…", spin_pair:"🔗 正在分析组合…", spin_trends:"🔥 正在检测趋势…", spin_channel:"📊 正在分析频道…", spin_hook:"🪝 正在分析留存率…" },
 tr:{ unit_char:"karakter", viral_add_num:"Bir sayı ekle", viral_add_em:"Duygusal bir kelime ekle", viral_add_hook:"Bir CTR kancası ekle", act_add_punct:"? veya ! ekle", desc_richness:"Açıklama zenginliği", top10_6:"Zaman damgaları ekle", top10_7:"Küçük resmi iyileştir", top10_8:"İfadeli bir yüz ekle", top10_9:"14–17 arası paylaş", top10_10:"İlk 10 yoruma yanıt ver", report_fix_pre:"Şunu düzelterek:", report_fix_mid:"nokta, puan şuna ulaşabilir", report_pts:"puan", report_vp:"Viral potansiyel", spin_thumb_ai:"🔍 Küçük resim analiz ediliyor…", spin_pair:"🔗 İkili analiz ediliyor…", spin_trends:"🔥 Trendler algılanıyor…", spin_channel:"📊 Kanal analiz ediliyor…", spin_hook:"🪝 Tutma analiz ediliyor…" },
 nl:{ unit_char:"tekens", viral_add_num:"Een getal toevoegen", viral_add_em:"Een emotioneel woord toevoegen", viral_add_hook:"Een CTR-hook toevoegen", act_add_punct:"? of ! toevoegen", desc_richness:"Rijkdom van de beschrijving", top10_6:"Tijdstempels toevoegen", top10_7:"De thumbnail verbeteren", top10_8:"Een expressief gezicht toevoegen", top10_9:"Posten 14–17 uur", top10_10:"Reageer op de eerste 10 reacties", report_fix_pre:"Door te corrigeren", report_fix_mid:"punt(en), kan de score bereiken", report_pts:"ptn", report_vp:"Viraal potentieel", spin_thumb_ai:"🔍 Thumbnail wordt geanalyseerd…", spin_pair:"🔗 Paar wordt geanalyseerd…", spin_trends:"🔥 Trends detecteren…", spin_channel:"📊 Kanaal wordt geanalyseerd…", spin_hook:"🪝 Retentie wordt geanalyseerd…" }
};
Object.keys(REPORT_I18N).forEach(l=>{ if(I18N[l]){ for(const k in REPORT_I18N[l]){ if(!(k in I18N[l])) I18N[l][k]=REPORT_I18N[l][k]; } } });

/* ── REPORT_I18N2 : en-tête Top 10 + tags concurrents (démo) — 14 langues ── */
const REPORT_I18N2 = {
 fr:{top10_title:"Top 10 actions",comp_why1:"Hook fort + miniature",comp_why2:"Chiffre + émotion",comp_why3:"Hook CTR fort"},
 en:{top10_title:"Top 10 actions",comp_why1:"Strong hook + thumbnail",comp_why2:"Number + emotion",comp_why3:"Strong CTR hook"},
 ar:{top10_title:"أفضل 10 إجراءات",comp_why1:"خطّاف قوي + صورة مصغّرة",comp_why2:"رقم + عاطفة",comp_why3:"خطّاف CTR قوي"},
 es:{top10_title:"Top 10 acciones",comp_why1:"Gancho fuerte + miniatura",comp_why2:"Número + emoción",comp_why3:"Gancho de CTR fuerte"},
 pt:{top10_title:"Top 10 ações",comp_why1:"Gancho forte + miniatura",comp_why2:"Número + emoção",comp_why3:"Gancho de CTR forte"},
 de:{top10_title:"Top 10 Aktionen",comp_why1:"Starker Hook + Thumbnail",comp_why2:"Zahl + Emotion",comp_why3:"Starker CTR-Hook"},
 it:{top10_title:"Top 10 azioni",comp_why1:"Hook forte + miniatura",comp_why2:"Numero + emozione",comp_why3:"Hook CTR forte"},
 ru:{top10_title:"Топ-10 действий",comp_why1:"Сильный хук + превью",comp_why2:"Число + эмоция",comp_why3:"Сильный CTR-хук"},
 ja:{top10_title:"トップ10アクション",comp_why1:"強いフック＋サムネイル",comp_why2:"数字＋感情",comp_why3:"強いCTRフック"},
 ko:{top10_title:"상위 10개 작업",comp_why1:"강력한 후크 + 썸네일",comp_why2:"숫자 + 감정",comp_why3:"강력한 CTR 후크"},
 hi:{top10_title:"शीर्ष 10 कार्य",comp_why1:"मज़बूत हुक + थंबनेल",comp_why2:"संख्या + भावना",comp_why3:"मज़बूत CTR हुक"},
 zh:{top10_title:"前 10 项行动",comp_why1:"强钩子 + 缩略图",comp_why2:"数字 + 情绪",comp_why3:"强点击率钩子"},
 tr:{top10_title:"İlk 10 eylem",comp_why1:"Güçlü kanca + küçük resim",comp_why2:"Sayı + duygu",comp_why3:"Güçlü CTR kancası"},
 nl:{top10_title:"Top 10 acties",comp_why1:"Sterke hook + thumbnail",comp_why2:"Getal + emotie",comp_why3:"Sterke CTR-hook"}
};
Object.keys(REPORT_I18N2).forEach(l=>{ if(I18N[l]){ for(const k in REPORT_I18N2[l]){ if(!(k in I18N[l])) I18N[l][k]=REPORT_I18N2[l][k]; } } });

/* ── COACH_I18N : écran Coach IA (hero, résumé, priorités, correction guidée, chat) — 14 langues ── */
const COACH_I18N = {
 fr:{co_label:"Score de la vidéo",co_now:"aujourd'hui",co_soon:"atteignable",co_min:"min",co_pts:"pts à gagner",co_found:"L'IA a trouvé {n} améliorations.",co_found1:"L'IA a trouvé 1 amélioration.",co_autofix:"Corriger automatiquement",co_next:"Continuer la correction",co_allgood:"Rien à corriger : ta vidéo est bien optimisée.",co_grow:"Trouver une idée virale",co_prio:"À corriger, par ordre d'impact",co_ok:"Ce qui fonctionne déjà",co_fix:"Corriger",co_report:"Voir le rapport complet",co_more:"Voir tout",co_less:"Réduire",co_of:"sur",co_a_thumb:"Retravaille ta miniature",co_w_thumb:"La miniature décide du clic avant le titre : c'est ton premier levier de CTR.",co_a_short:"Publie un Short sur ce sujet",co_w_short:"Un Short renvoie du trafic vers la vidéo longue et relance sa distribution.",co_a_tags:"Ajoute des tags pertinents",co_w_tags:"Sans tags, YouTube a moins d'indices pour associer ta vidéo à une recherche.",co_a_comp:"Regarde ce que font tes concurrents",co_w_comp:"Ton score est correct : le prochain gain vient de l'écart avec les vidéos qui te dépassent.",co_chat:"Coach IA",co_chat_ph:"Pose ta question sur cette vidéo…",co_chat_hi:"Je viens d'analyser cette vidéo. Que veux-tu savoir ?",co_q_ctr:"Pourquoi mon CTR est faible ?",co_q_flat:"Pourquoi cette vidéo ne décolle pas ?",co_q_next:"Que dois-je faire ensuite ?",co_q_comp:"Comment dépasser mon concurrent ?",co_chat_send:"Envoyer",co_chat_open:"Parler à l'assistant IA",co_chat_sub:"Pose ta question, l'IA te répond",co_chat_close:"Fermer",co_af_step:"Étape {i} {of} {n}",co_af_done:"Correction terminée. Applique le résultat sur YouTube, puis reviens ici.",co_af_open:"Ouverture de l'outil…",co_unknown:"Je n'ai pas de réponse fiable à ça pour l'instant. Voici ce que je sais de cette vidéo :"},
 en:{co_label:"Video score",co_now:"today",co_soon:"reachable",co_min:"min",co_pts:"pts to gain",co_found:"The AI found {n} improvements.",co_found1:"The AI found 1 improvement.",co_autofix:"Fix automatically",co_next:"Continue fixing",co_allgood:"Nothing to fix: your video is well optimized.",co_grow:"Find a viral idea",co_prio:"To fix, by impact",co_ok:"What already works",co_fix:"Fix",co_report:"See the full report",co_more:"See all",co_less:"Collapse",co_of:"of",co_a_thumb:"Rework your thumbnail",co_w_thumb:"The thumbnail decides the click before the title — it's your first CTR lever.",co_a_short:"Post a Short on this topic",co_w_short:"A Short sends traffic back to the long video and restarts its distribution.",co_a_tags:"Add relevant tags",co_w_tags:"Without tags, YouTube has fewer clues to match your video to a search.",co_a_comp:"Look at what your competitors do",co_w_comp:"Your score is decent: the next gain comes from the gap with the videos beating you.",co_chat:"AI Coach",co_chat_ph:"Ask about this video…",co_chat_hi:"I just analyzed this video. What do you want to know?",co_q_ctr:"Why is my CTR low?",co_q_flat:"Why isn't this video taking off?",co_q_next:"What should I do next?",co_q_comp:"How do I beat my competitor?",co_chat_send:"Send",co_chat_open:"Talk to the AI assistant",co_chat_sub:"Ask your question, the AI answers",co_chat_close:"Close",co_af_step:"Step {i} {of} {n}",co_af_done:"Fix done. Apply the result on YouTube, then come back here.",co_af_open:"Opening the tool…",co_unknown:"I don't have a reliable answer for that yet. Here's what I know about this video:"},
 ar:{co_label:"درجة الفيديو",co_now:"اليوم",co_soon:"قابل للتحقيق",co_min:"دقيقة",co_pts:"نقطة للكسب",co_found:"وجد الذكاء الاصطناعي {n} تحسينات.",co_found1:"وجد الذكاء الاصطناعي تحسينًا واحدًا.",co_autofix:"أصلح تلقائيًا",co_next:"متابعة التصحيح",co_allgood:"لا شيء لإصلاحه: فيديوك محسّن جيدًا.",co_grow:"اعثر على فكرة فيروسية",co_prio:"للإصلاح، حسب التأثير",co_ok:"ما ينجح بالفعل",co_fix:"أصلح",co_report:"اعرض التقرير الكامل",co_more:"عرض الكل",co_less:"تصغير",co_of:"من",co_a_thumb:"أعد تصميم صورتك المصغّرة",co_w_thumb:"الصورة المصغّرة تحدّد النقرة قبل العنوان — إنها أول رافعة لـ CTR.",co_a_short:"انشر Short عن هذا الموضوع",co_w_short:"يعيد الـ Short حركة المرور إلى الفيديو الطويل ويعيد إطلاق توزيعه.",co_a_tags:"أضف وسومًا مناسبة",co_w_tags:"بدون وسوم، لدى يوتيوب أدلّة أقل لربط فيديوك ببحث ما.",co_a_comp:"انظر إلى ما يفعله منافسوك",co_w_comp:"درجتك جيدة: الربح التالي يأتي من الفارق مع الفيديوهات التي تتقدّم عليك.",co_chat:"مدرّب الذكاء الاصطناعي",co_chat_ph:"اسأل عن هذا الفيديو…",co_chat_hi:"لقد حلّلت هذا الفيديو للتو. ماذا تريد أن تعرف؟",co_q_ctr:"لماذا معدل النقر منخفض؟",co_q_flat:"لماذا لا ينتشر هذا الفيديو؟",co_q_next:"ما الذي يجب أن أفعله بعد ذلك؟",co_q_comp:"كيف أتفوّق على منافسي؟",co_chat_send:"إرسال",co_chat_open:"تحدّث إلى مساعد الذكاء الاصطناعي",co_chat_sub:"اطرح سؤالك، والذكاء الاصطناعي يجيبك",co_chat_close:"إغلاق",co_af_step:"الخطوة {i} {of} {n}",co_af_done:"تم التصحيح. طبّق النتيجة على يوتيوب ثم عد إلى هنا.",co_af_open:"جارٍ فتح الأداة…",co_unknown:"ليس لديّ إجابة موثوقة عن ذلك بعد. هذا ما أعرفه عن هذا الفيديو:"},
 es:{co_label:"Puntuación del vídeo",co_now:"hoy",co_soon:"alcanzable",co_min:"min",co_pts:"pts por ganar",co_found:"La IA encontró {n} mejoras.",co_found1:"La IA encontró 1 mejora.",co_autofix:"Corregir automáticamente",co_next:"Continuar la corrección",co_allgood:"Nada que corregir: tu vídeo está bien optimizado.",co_grow:"Encuentra una idea viral",co_prio:"Por corregir, por impacto",co_ok:"Lo que ya funciona",co_fix:"Corregir",co_report:"Ver el informe completo",co_more:"Ver todo",co_less:"Reducir",co_of:"de",co_a_thumb:"Rehaz tu miniatura",co_w_thumb:"La miniatura decide el clic antes del título: es tu primera palanca de CTR.",co_a_short:"Publica un Short sobre este tema",co_w_short:"Un Short devuelve tráfico al vídeo largo y reactiva su distribución.",co_a_tags:"Añade etiquetas relevantes",co_w_tags:"Sin etiquetas, YouTube tiene menos pistas para asociar tu vídeo a una búsqueda.",co_a_comp:"Mira lo que hacen tus competidores",co_w_comp:"Tu puntuación es correcta: la próxima ganancia viene de la diferencia con los vídeos que te superan.",co_chat:"Coach IA",co_chat_ph:"Pregunta sobre este vídeo…",co_chat_hi:"Acabo de analizar este vídeo. ¿Qué quieres saber?",co_q_ctr:"¿Por qué mi CTR es bajo?",co_q_flat:"¿Por qué este vídeo no despega?",co_q_next:"¿Qué debo hacer ahora?",co_q_comp:"¿Cómo supero a mi competidor?",co_chat_send:"Enviar",co_chat_open:"Hablar con el asistente IA",co_chat_sub:"Haz tu pregunta, la IA te responde",co_chat_close:"Cerrar",co_af_step:"Paso {i} {of} {n}",co_af_done:"Corrección terminada. Aplica el resultado en YouTube y vuelve aquí.",co_af_open:"Abriendo la herramienta…",co_unknown:"Todavía no tengo una respuesta fiable para eso. Esto es lo que sé de este vídeo:"},
 pt:{co_label:"Pontuação do vídeo",co_now:"hoje",co_soon:"alcançável",co_min:"min",co_pts:"pts a ganhar",co_found:"A IA encontrou {n} melhorias.",co_found1:"A IA encontrou 1 melhoria.",co_autofix:"Corrigir automaticamente",co_next:"Continuar a correção",co_allgood:"Nada a corrigir: o seu vídeo está bem otimizado.",co_grow:"Encontre uma ideia viral",co_prio:"A corrigir, por impacto",co_ok:"O que já funciona",co_fix:"Corrigir",co_report:"Ver o relatório completo",co_more:"Ver tudo",co_less:"Reduzir",co_of:"de",co_a_thumb:"Refaça sua miniatura",co_w_thumb:"A miniatura decide o clique antes do título: é a sua primeira alavanca de CTR.",co_a_short:"Publique um Short sobre este tema",co_w_short:"Um Short devolve tráfego ao vídeo longo e reativa a sua distribuição.",co_a_tags:"Adicione tags relevantes",co_w_tags:"Sem tags, o YouTube tem menos pistas para associar o seu vídeo a uma busca.",co_a_comp:"Veja o que fazem os seus concorrentes",co_w_comp:"A sua pontuação é razoável: o próximo ganho vem da diferença com os vídeos que o superam.",co_chat:"Coach IA",co_chat_ph:"Pergunte sobre este vídeo…",co_chat_hi:"Acabei de analisar este vídeo. O que quer saber?",co_q_ctr:"Porque é que o meu CTR é baixo?",co_q_flat:"Porque é que este vídeo não decola?",co_q_next:"O que devo fazer a seguir?",co_q_comp:"Como supero o meu concorrente?",co_chat_send:"Enviar",co_chat_open:"Falar com o assistente de IA",co_chat_sub:"Faz a tua pergunta, a IA responde",co_chat_close:"Fechar",co_af_step:"Etapa {i} {of} {n}",co_af_done:"Correção concluída. Aplique o resultado no YouTube e volte aqui.",co_af_open:"A abrir a ferramenta…",co_unknown:"Ainda não tenho uma resposta fiável para isso. Eis o que sei deste vídeo:"},
 de:{co_label:"Video-Score",co_now:"heute",co_soon:"erreichbar",co_min:"Min",co_pts:"Punkte Potenzial",co_found:"Die KI hat {n} Verbesserungen gefunden.",co_found1:"Die KI hat 1 Verbesserung gefunden.",co_autofix:"Automatisch beheben",co_next:"Weiter beheben",co_allgood:"Nichts zu beheben: Dein Video ist gut optimiert.",co_grow:"Finde eine virale Idee",co_prio:"Zu beheben, nach Wirkung",co_ok:"Was schon funktioniert",co_fix:"Beheben",co_report:"Vollständigen Bericht ansehen",co_more:"Alle anzeigen",co_less:"Einklappen",co_of:"von",co_a_thumb:"Überarbeite dein Thumbnail",co_w_thumb:"Das Thumbnail entscheidet über den Klick vor dem Titel — dein erster CTR-Hebel.",co_a_short:"Poste einen Short zu diesem Thema",co_w_short:"Ein Short bringt Traffic zurück zum langen Video und startet seine Verbreitung neu.",co_a_tags:"Füge passende Tags hinzu",co_w_tags:"Ohne Tags hat YouTube weniger Hinweise, dein Video einer Suche zuzuordnen.",co_a_comp:"Sieh dir deine Konkurrenz an",co_w_comp:"Dein Score ist in Ordnung: Der nächste Gewinn liegt im Abstand zu den Videos, die dich überholen.",co_chat:"KI-Coach",co_chat_ph:"Frag zu diesem Video…",co_chat_hi:"Ich habe dieses Video gerade analysiert. Was möchtest du wissen?",co_q_ctr:"Warum ist meine CTR niedrig?",co_q_flat:"Warum kommt dieses Video nicht in Gang?",co_q_next:"Was soll ich als Nächstes tun?",co_q_comp:"Wie überhole ich meine Konkurrenz?",co_chat_send:"Senden",co_chat_open:"Mit dem KI-Assistenten sprechen",co_chat_sub:"Stell deine Frage, die KI antwortet",co_chat_close:"Schließen",co_af_step:"Schritt {i} {of} {n}",co_af_done:"Behebung fertig. Wende das Ergebnis auf YouTube an und komm zurück.",co_af_open:"Werkzeug wird geöffnet…",co_unknown:"Dazu habe ich noch keine verlässliche Antwort. Das weiß ich über dieses Video:"},
 it:{co_label:"Punteggio del video",co_now:"oggi",co_soon:"raggiungibile",co_min:"min",co_pts:"punti da guadagnare",co_found:"L'IA ha trovato {n} miglioramenti.",co_found1:"L'IA ha trovato 1 miglioramento.",co_autofix:"Correggi automaticamente",co_next:"Continua la correzione",co_allgood:"Niente da correggere: il tuo video è ben ottimizzato.",co_grow:"Trova un'idea virale",co_prio:"Da correggere, per impatto",co_ok:"Ciò che funziona già",co_fix:"Correggi",co_report:"Vedi il report completo",co_more:"Vedi tutto",co_less:"Riduci",co_of:"su",co_a_thumb:"Rifai la tua miniatura",co_w_thumb:"La miniatura decide il clic prima del titolo: è la tua prima leva di CTR.",co_a_short:"Pubblica uno Short su questo tema",co_w_short:"Uno Short riporta traffico al video lungo e riavvia la sua distribuzione.",co_a_tags:"Aggiungi tag pertinenti",co_w_tags:"Senza tag, YouTube ha meno indizi per associare il tuo video a una ricerca.",co_a_comp:"Guarda cosa fanno i tuoi concorrenti",co_w_comp:"Il tuo punteggio è discreto: il prossimo guadagno viene dal divario con i video che ti superano.",co_chat:"Coach IA",co_chat_ph:"Fai una domanda su questo video…",co_chat_hi:"Ho appena analizzato questo video. Cosa vuoi sapere?",co_q_ctr:"Perché il mio CTR è basso?",co_q_flat:"Perché questo video non decolla?",co_q_next:"Cosa devo fare adesso?",co_q_comp:"Come supero il mio concorrente?",co_chat_send:"Invia",co_chat_open:"Parla con l'assistente IA",co_chat_sub:"Fai la tua domanda, l'IA ti risponde",co_chat_close:"Chiudi",co_af_step:"Passo {i} {of} {n}",co_af_done:"Correzione completata. Applica il risultato su YouTube, poi torna qui.",co_af_open:"Apertura dello strumento…",co_unknown:"Non ho ancora una risposta affidabile. Ecco cosa so di questo video:"},
 ru:{co_label:"Оценка видео",co_now:"сегодня",co_soon:"достижимо",co_min:"мин",co_pts:"очков к росту",co_found:"ИИ нашёл {n} улучшений.",co_found1:"ИИ нашёл 1 улучшение.",co_autofix:"Исправить автоматически",co_next:"Продолжить исправление",co_allgood:"Исправлять нечего: видео хорошо оптимизировано.",co_grow:"Найти вирусную идею",co_prio:"Исправить, по влиянию",co_ok:"Что уже работает",co_fix:"Исправить",co_report:"Открыть полный отчёт",co_more:"Показать всё",co_less:"Свернуть",co_of:"из",co_a_thumb:"Переделай обложку",co_w_thumb:"Обложка решает клик раньше заголовка — это твой первый рычаг CTR.",co_a_short:"Опубликуй Short на эту тему",co_w_short:"Short возвращает трафик к длинному видео и перезапускает его показы.",co_a_tags:"Добавь релевантные теги",co_w_tags:"Без тегов у YouTube меньше подсказок, чтобы связать видео с запросом.",co_a_comp:"Посмотри, что делают конкуренты",co_w_comp:"Оценка приличная: следующий рост — в разрыве с видео, которые тебя обходят.",co_chat:"ИИ-коуч",co_chat_ph:"Спроси об этом видео…",co_chat_hi:"Я только что проанализировал это видео. Что хочешь узнать?",co_q_ctr:"Почему у меня низкий CTR?",co_q_flat:"Почему это видео не набирает?",co_q_next:"Что делать дальше?",co_q_comp:"Как обойти конкурента?",co_chat_send:"Отправить",co_chat_open:"Поговорить с ИИ-ассистентом",co_chat_sub:"Задай вопрос — ИИ ответит",co_chat_close:"Закрыть",co_af_step:"Шаг {i} {of} {n}",co_af_done:"Исправление готово. Примени результат на YouTube и возвращайся.",co_af_open:"Открываю инструмент…",co_unknown:"Пока у меня нет надёжного ответа. Вот что я знаю об этом видео:"},
 ja:{co_label:"動画スコア",co_now:"現在",co_soon:"到達可能",co_min:"分",co_pts:"pt 伸ばせる",co_found:"AI が {n} 件の改善点を見つけました。",co_found1:"AI が 1 件の改善点を見つけました。",co_autofix:"自動で修正する",co_next:"修正を続ける",co_allgood:"修正点はありません。よく最適化されています。",co_grow:"バズるアイデアを探す",co_prio:"修正すべき点（影響順）",co_ok:"すでに機能している点",co_fix:"修正",co_report:"完全なレポートを見る",co_more:"すべて表示",co_less:"折りたたむ",co_of:"/",co_a_thumb:"サムネイルを作り直す",co_w_thumb:"サムネイルはタイトルより先にクリックを決めます。CTR の第一のレバーです。",co_a_short:"このテーマで Short を投稿する",co_w_short:"Short は長尺動画にトラフィックを戻し、配信を再起動します。",co_a_tags:"関連タグを追加する",co_w_tags:"タグがないと、YouTube が検索と動画を結びつける手がかりが減ります。",co_a_comp:"競合の動画を見る",co_w_comp:"スコアは悪くありません。次の伸びは、あなたを上回る動画との差にあります。",co_chat:"AI コーチ",co_chat_ph:"この動画について質問…",co_chat_hi:"この動画を分析しました。何を知りたいですか？",co_q_ctr:"CTR が低いのはなぜ？",co_q_flat:"この動画が伸びないのはなぜ？",co_q_next:"次に何をすべき？",co_q_comp:"競合を超えるには？",co_chat_send:"送信",co_chat_open:"AI アシスタントに相談する",co_chat_sub:"質問すると AI が答えます",co_chat_close:"閉じる",co_af_step:"ステップ {i} {of} {n}",co_af_done:"修正が完了しました。YouTube に適用してから戻ってください。",co_af_open:"ツールを開いています…",co_unknown:"それにはまだ確かな答えがありません。この動画について分かっているのは次の点です:"},
 ko:{co_label:"영상 점수",co_now:"현재",co_soon:"도달 가능",co_min:"분",co_pts:"점 상승 여지",co_found:"AI가 개선점 {n}개를 찾았습니다.",co_found1:"AI가 개선점 1개를 찾았습니다.",co_autofix:"자동으로 수정",co_next:"수정 계속하기",co_allgood:"수정할 것이 없습니다. 잘 최적화되어 있습니다.",co_grow:"바이럴 아이디어 찾기",co_prio:"수정할 항목 (영향順)",co_ok:"이미 잘 되는 것",co_fix:"수정",co_report:"전체 리포트 보기",co_more:"모두 보기",co_less:"접기",co_of:"/",co_a_thumb:"썸네일을 다시 만들기",co_w_thumb:"썸네일은 제목보다 먼저 클릭을 결정합니다. CTR의 첫 번째 레버입니다.",co_a_short:"이 주제로 Short 올리기",co_w_short:"Short는 롱폼 영상으로 트래픽을 돌려보내고 노출을 다시 시작시킵니다.",co_a_tags:"관련 태그 추가",co_w_tags:"태그가 없으면 YouTube가 검색과 영상을 연결할 단서가 줄어듭니다.",co_a_comp:"경쟁 채널을 살펴보기",co_w_comp:"점수는 괜찮습니다. 다음 상승은 당신을 앞서는 영상과의 격차에서 나옵니다.",co_chat:"AI 코치",co_chat_ph:"이 영상에 대해 질문하세요…",co_chat_hi:"이 영상을 방금 분석했습니다. 무엇이 궁금한가요?",co_q_ctr:"내 CTR이 낮은 이유는?",co_q_flat:"이 영상이 뜨지 않는 이유는?",co_q_next:"다음에 무엇을 해야 하나요?",co_q_comp:"경쟁자를 어떻게 넘어서죠?",co_chat_send:"보내기",co_chat_open:"AI 어시스턴트와 대화하기",co_chat_sub:"질문하면 AI가 답해줍니다",co_chat_close:"닫기",co_af_step:"단계 {i} {of} {n}",co_af_done:"수정이 끝났습니다. YouTube에 적용한 뒤 돌아오세요.",co_af_open:"도구를 여는 중…",co_unknown:"아직 확실한 답이 없습니다. 이 영상에 대해 아는 것은 다음과 같습니다:"},
 hi:{co_label:"वीडियो स्कोर",co_now:"आज",co_soon:"पहुँच में",co_min:"मिनट",co_pts:"अंक कमाने को",co_found:"AI ने {n} सुधार खोजे।",co_found1:"AI ने 1 सुधार खोजा।",co_autofix:"स्वतः ठीक करें",co_next:"सुधार जारी रखें",co_allgood:"कुछ ठीक करने को नहीं: आपका वीडियो अच्छी तरह अनुकूलित है।",co_grow:"वायरल आइडिया खोजें",co_prio:"ठीक करने योग्य, प्रभाव क्रम में",co_ok:"जो पहले से काम कर रहा है",co_fix:"ठीक करें",co_report:"पूरी रिपोर्ट देखें",co_more:"सब देखें",co_less:"छोटा करें",co_of:"में से",co_a_thumb:"अपना थंबनेल दोबारा बनाएँ",co_w_thumb:"थंबनेल शीर्षक से पहले क्लिक तय करता है — यह आपका पहला CTR लीवर है।",co_a_short:"इस विषय पर एक Short डालें",co_w_short:"Short लंबे वीडियो पर ट्रैफ़िक लौटाता है और उसका वितरण फिर शुरू करता है।",co_a_tags:"प्रासंगिक टैग जोड़ें",co_w_tags:"टैग के बिना YouTube के पास आपके वीडियो को खोज से जोड़ने के कम संकेत होते हैं।",co_a_comp:"देखें आपके प्रतियोगी क्या कर रहे हैं",co_w_comp:"आपका स्कोर ठीक है: अगला लाभ आपसे आगे निकलने वाले वीडियो के अंतर से आएगा।",co_chat:"AI कोच",co_chat_ph:"इस वीडियो के बारे में पूछें…",co_chat_hi:"मैंने अभी यह वीडियो विश्लेषित किया। आप क्या जानना चाहते हैं?",co_q_ctr:"मेरा CTR कम क्यों है?",co_q_flat:"यह वीडियो क्यों नहीं चल रहा?",co_q_next:"अब मुझे क्या करना चाहिए?",co_q_comp:"मैं अपने प्रतियोगी से आगे कैसे निकलूँ?",co_chat_send:"भेजें",co_chat_open:"AI असिस्टेंट से बात करें",co_chat_sub:"सवाल पूछें, AI जवाब देगा",co_chat_close:"बंद करें",co_af_step:"चरण {i} {of} {n}",co_af_done:"सुधार पूरा। परिणाम YouTube पर लागू करें, फिर यहाँ लौटें।",co_af_open:"टूल खोल रहे हैं…",co_unknown:"इसका भरोसेमंद उत्तर अभी मेरे पास नहीं है। इस वीडियो के बारे में मुझे यह पता है:"},
 zh:{co_label:"视频评分",co_now:"当前",co_soon:"可达到",co_min:"分钟",co_pts:"分可提升",co_found:"AI 找到 {n} 项改进。",co_found1:"AI 找到 1 项改进。",co_autofix:"自动修正",co_next:"继续修正",co_allgood:"无需修正：你的视频已优化良好。",co_grow:"寻找爆款选题",co_prio:"待修正（按影响排序）",co_ok:"已经做对的地方",co_fix:"修正",co_report:"查看完整报告",co_more:"查看全部",co_less:"收起",co_of:"/",co_a_thumb:"重做你的缩略图",co_w_thumb:"缩略图比标题更早决定点击——它是你的第一个点击率杠杆。",co_a_short:"就这个主题发一条 Short",co_w_short:"Short 会把流量带回长视频，重新启动它的分发。",co_a_tags:"添加相关标签",co_w_tags:"没有标签，YouTube 就少了把视频与搜索关联起来的线索。",co_a_comp:"看看你的竞争对手在做什么",co_w_comp:"你的分数不错：下一步增长来自与超过你的视频之间的差距。",co_chat:"AI 教练",co_chat_ph:"就这个视频提问…",co_chat_hi:"我刚分析完这个视频。你想了解什么？",co_q_ctr:"我的点击率为什么低？",co_q_flat:"这个视频为什么起不来？",co_q_next:"接下来我该做什么？",co_q_comp:"怎么超过我的竞争对手？",co_chat_send:"发送",co_chat_open:"与 AI 助手对话",co_chat_sub:"提出问题，AI 为你解答",co_chat_close:"关闭",co_af_step:"第 {i} 步 {of} {n}",co_af_done:"修正完成。把结果应用到 YouTube，然后回到这里。",co_af_open:"正在打开工具…",co_unknown:"这个问题我暂时没有可靠答案。以下是我对这个视频的了解："},
 tr:{co_label:"Video puanı",co_now:"bugün",co_soon:"ulaşılabilir",co_min:"dk",co_pts:"puan kazanılabilir",co_found:"Yapay zekâ {n} iyileştirme buldu.",co_found1:"Yapay zekâ 1 iyileştirme buldu.",co_autofix:"Otomatik düzelt",co_next:"Düzeltmeye devam et",co_allgood:"Düzeltilecek bir şey yok: videon iyi optimize edilmiş.",co_grow:"Viral bir fikir bul",co_prio:"Düzeltilecekler, etkiye göre",co_ok:"Zaten işleyenler",co_fix:"Düzelt",co_report:"Tam raporu gör",co_more:"Tümünü gör",co_less:"Daralt",co_of:"/",co_a_thumb:"Küçük resmini yenile",co_w_thumb:"Küçük resim tıklamayı başlıktan önce belirler — ilk CTR kaldıracın.",co_a_short:"Bu konuda bir Short paylaş",co_w_short:"Short, uzun videoya trafik geri gönderir ve dağıtımını yeniden başlatır.",co_a_tags:"İlgili etiketler ekle",co_w_tags:"Etiket olmadan YouTube'un videonu bir aramayla eşleştirecek daha az ipucu olur.",co_a_comp:"Rakiplerinin ne yaptığına bak",co_w_comp:"Puanın fena değil: sıradaki kazanç, seni geçen videolarla arandaki farktan gelir.",co_chat:"Yapay Zekâ Koçu",co_chat_ph:"Bu video hakkında sor…",co_chat_hi:"Bu videoyu az önce analiz ettim. Ne bilmek istersin?",co_q_ctr:"CTR'm neden düşük?",co_q_flat:"Bu video neden tutmuyor?",co_q_next:"Şimdi ne yapmalıyım?",co_q_comp:"Rakibimi nasıl geçerim?",co_chat_send:"Gönder",co_chat_open:"Yapay zekâ asistanıyla konuş",co_chat_sub:"Sorunu sor, yapay zekâ yanıtlasın",co_chat_close:"Kapat",co_af_step:"Adım {i} {of} {n}",co_af_done:"Düzeltme tamam. Sonucu YouTube'da uygula, sonra buraya dön.",co_af_open:"Araç açılıyor…",co_unknown:"Buna henüz güvenilir bir yanıtım yok. Bu video hakkında bildiklerim:"},
 nl:{co_label:"Videoscore",co_now:"vandaag",co_soon:"haalbaar",co_min:"min",co_pts:"punten te winnen",co_found:"De AI vond {n} verbeteringen.",co_found1:"De AI vond 1 verbetering.",co_autofix:"Automatisch verbeteren",co_next:"Doorgaan met verbeteren",co_allgood:"Niets te verbeteren: je video is goed geoptimaliseerd.",co_grow:"Vind een viraal idee",co_prio:"Te verbeteren, op impact",co_ok:"Wat al werkt",co_fix:"Verbeteren",co_report:"Volledig rapport bekijken",co_more:"Alles tonen",co_less:"Inklappen",co_of:"van",co_a_thumb:"Werk je thumbnail bij",co_w_thumb:"De thumbnail bepaalt de klik nog voor de titel — je eerste CTR-hefboom.",co_a_short:"Post een Short over dit onderwerp",co_w_short:"Een Short stuurt verkeer terug naar de lange video en herstart de distributie.",co_a_tags:"Voeg relevante tags toe",co_w_tags:"Zonder tags heeft YouTube minder aanwijzingen om je video aan een zoekopdracht te koppelen.",co_a_comp:"Kijk wat je concurrenten doen",co_w_comp:"Je score is redelijk: de volgende winst zit in het verschil met de video's die je voorbijgaan.",co_chat:"AI-coach",co_chat_ph:"Vraag iets over deze video…",co_chat_hi:"Ik heb deze video net geanalyseerd. Wat wil je weten?",co_q_ctr:"Waarom is mijn CTR laag?",co_q_flat:"Waarom komt deze video niet van de grond?",co_q_next:"Wat moet ik nu doen?",co_q_comp:"Hoe ga ik mijn concurrent voorbij?",co_chat_send:"Verzenden",co_chat_open:"Praat met de AI-assistent",co_chat_sub:"Stel je vraag, de AI antwoordt",co_chat_close:"Sluiten",co_af_step:"Stap {i} {of} {n}",co_af_done:"Verbetering klaar. Pas het resultaat toe op YouTube en kom hier terug.",co_af_open:"Tool wordt geopend…",co_unknown:"Daar heb ik nog geen betrouwbaar antwoord op. Dit weet ik over deze video:"}
};
Object.keys(COACH_I18N).forEach(l=>{ if(I18N[l]){ for(const k in COACH_I18N[l]){ if(!(k in I18N[l])) I18N[l][k]=COACH_I18N[l][k]; } } });

/* ── THUMB_I18N : mesures réelles de la miniature (voir ensureThumbAnalysis) — 14 langues ── */
const THUMB_I18N = {
 fr:{th_measured:"Mesures réelles de l'image",th_note:"Mesuré sur ta miniature, en local. Aucune estimation.",th_m_contrast:"Contraste",th_m_light:"Luminosité",th_m_color:"Couleurs",th_m_sharp:"Netteté",th_m_space:"Lisibilité",th_m_human:"Présence humaine",th_m_res:"Résolution",th_v_dark:"Miniature sombre : elle s'efface dans le flux YouTube.",th_v_washed:"Image surexposée : les détails se perdent dans le blanc.",th_v_flat:"Peu de contraste : les éléments se confondent en petit format.",th_v_dull:"Couleurs ternes : rien n'accroche l'œil dans la grille.",th_v_soft:"Image peu nette : elle paraît floue en miniature.",th_v_busy:"Image chargée : trop d'éléments pour être lue en 1 seconde.",th_v_empty:"Image très vide : aucun point d'accroche visuel.",th_v_noface:"Aucun visage détecté : un regard humain augmente le clic.",th_v_face:"Visage probable détecté.",th_v_lowres:"Résolution faible : passe en 1280×720.",th_none:"Miniature non mesurable (image indisponible) — elle est exclue du score.",th_ok:"Image équilibrée : rien de bloquant côté visuel."},
 en:{th_measured:"Real image measurements",th_note:"Measured on your thumbnail, locally. No estimate.",th_m_contrast:"Contrast",th_m_light:"Brightness",th_m_color:"Colors",th_m_sharp:"Sharpness",th_m_space:"Readability",th_m_human:"Human presence",th_m_res:"Resolution",th_v_dark:"Dark thumbnail: it fades away in the YouTube feed.",th_v_washed:"Overexposed image: details are lost in the white.",th_v_flat:"Low contrast: elements blend together at small size.",th_v_dull:"Dull colors: nothing catches the eye in the grid.",th_v_soft:"Soft image: it looks blurry as a thumbnail.",th_v_busy:"Cluttered image: too many elements to read in 1 second.",th_v_empty:"Very empty image: no visual anchor.",th_v_noface:"No face detected: a human gaze increases clicks.",th_v_face:"Probable face detected.",th_v_lowres:"Low resolution: move to 1280×720.",th_none:"Thumbnail not measurable (image unavailable) — excluded from the score.",th_ok:"Balanced image: nothing blocking on the visual side."},
 ar:{th_measured:"قياسات حقيقية للصورة",th_note:"قياس على صورتك المصغّرة محليًا. لا تقديرات.",th_m_contrast:"التباين",th_m_light:"السطوع",th_m_color:"الألوان",th_m_sharp:"الحدّة",th_m_space:"قابلية القراءة",th_m_human:"حضور بشري",th_m_res:"الدقة",th_v_dark:"صورة مصغّرة داكنة: تتلاشى في تدفق يوتيوب.",th_v_washed:"صورة ساطعة زيادة: التفاصيل تضيع في البياض.",th_v_flat:"تباين منخفض: العناصر تتشابه بالحجم الصغير.",th_v_dull:"ألوان باهتة: لا شيء يجذب العين في الشبكة.",th_v_soft:"صورة غير حادّة: تبدو ضبابية كصورة مصغّرة.",th_v_busy:"صورة مزدحمة: عناصر كثيرة جدًا لقراءتها في ثانية.",th_v_empty:"صورة فارغة جدًا: لا نقطة جذب بصرية.",th_v_noface:"لم يُكتشف وجه: النظرة البشرية تزيد النقرات.",th_v_face:"يُحتمل وجود وجه.",th_v_lowres:"دقة منخفضة: انتقل إلى 1280×720.",th_none:"لا يمكن قياس الصورة المصغّرة (غير متوفرة) — مستثناة من الدرجة.",th_ok:"صورة متوازنة: لا شيء يعيق من الناحية البصرية."},
 es:{th_measured:"Mediciones reales de la imagen",th_note:"Medido en tu miniatura, en local. Sin estimaciones.",th_m_contrast:"Contraste",th_m_light:"Luminosidad",th_m_color:"Colores",th_m_sharp:"Nitidez",th_m_space:"Legibilidad",th_m_human:"Presencia humana",th_m_res:"Resolución",th_v_dark:"Miniatura oscura: se difumina en el feed de YouTube.",th_v_washed:"Imagen sobreexpuesta: los detalles se pierden en el blanco.",th_v_flat:"Poco contraste: los elementos se confunden en tamaño pequeño.",th_v_dull:"Colores apagados: nada atrae la vista en la parrilla.",th_v_soft:"Imagen poco nítida: parece borrosa como miniatura.",th_v_busy:"Imagen sobrecargada: demasiados elementos para leerla en 1 segundo.",th_v_empty:"Imagen muy vacía: sin ningún punto de anclaje visual.",th_v_noface:"Ningún rostro detectado: una mirada humana aumenta los clics.",th_v_face:"Rostro probable detectado.",th_v_lowres:"Resolución baja: pasa a 1280×720.",th_none:"Miniatura no medible (imagen no disponible) — excluida de la puntuación.",th_ok:"Imagen equilibrada: nada bloqueante en lo visual."},
 pt:{th_measured:"Medições reais da imagem",th_note:"Medido na sua miniatura, localmente. Sem estimativas.",th_m_contrast:"Contraste",th_m_light:"Luminosidade",th_m_color:"Cores",th_m_sharp:"Nitidez",th_m_space:"Legibilidade",th_m_human:"Presença humana",th_m_res:"Resolução",th_v_dark:"Miniatura escura: desaparece no feed do YouTube.",th_v_washed:"Imagem sobre-exposta: os detalhes perdem-se no branco.",th_v_flat:"Pouco contraste: os elementos confundem-se em tamanho pequeno.",th_v_dull:"Cores apagadas: nada chama a atenção na grelha.",th_v_soft:"Imagem pouco nítida: parece desfocada como miniatura.",th_v_busy:"Imagem carregada: elementos a mais para ler em 1 segundo.",th_v_empty:"Imagem muito vazia: nenhum ponto de ancoragem visual.",th_v_noface:"Nenhum rosto detetado: um olhar humano aumenta os cliques.",th_v_face:"Rosto provável detetado.",th_v_lowres:"Resolução baixa: passe para 1280×720.",th_none:"Miniatura não mensurável (imagem indisponível) — excluída da pontuação.",th_ok:"Imagem equilibrada: nada bloqueante no visual."},
 de:{th_measured:"Echte Bildmessungen",th_note:"An deinem Thumbnail gemessen, lokal. Keine Schätzung.",th_m_contrast:"Kontrast",th_m_light:"Helligkeit",th_m_color:"Farben",th_m_sharp:"Schärfe",th_m_space:"Lesbarkeit",th_m_human:"Menschliche Präsenz",th_m_res:"Auflösung",th_v_dark:"Dunkles Thumbnail: es verschwindet im YouTube-Feed.",th_v_washed:"Überbelichtetes Bild: Details gehen im Weiß verloren.",th_v_flat:"Wenig Kontrast: Elemente verschmelzen in kleiner Größe.",th_v_dull:"Matte Farben: nichts fängt den Blick im Raster.",th_v_soft:"Unscharfes Bild: wirkt als Thumbnail verwaschen.",th_v_busy:"Überladenes Bild: zu viele Elemente für 1 Sekunde.",th_v_empty:"Sehr leeres Bild: kein visueller Ankerpunkt.",th_v_noface:"Kein Gesicht erkannt: ein menschlicher Blick erhöht die Klicks.",th_v_face:"Wahrscheinliches Gesicht erkannt.",th_v_lowres:"Niedrige Auflösung: wechsle zu 1280×720.",th_none:"Thumbnail nicht messbar (Bild nicht verfügbar) — aus dem Score ausgeschlossen.",th_ok:"Ausgewogenes Bild: visuell nichts Blockierendes."},
 it:{th_measured:"Misurazioni reali dell'immagine",th_note:"Misurato sulla tua miniatura, in locale. Nessuna stima.",th_m_contrast:"Contrasto",th_m_light:"Luminosità",th_m_color:"Colori",th_m_sharp:"Nitidezza",th_m_space:"Leggibilità",th_m_human:"Presenza umana",th_m_res:"Risoluzione",th_v_dark:"Miniatura scura: si dissolve nel feed di YouTube.",th_v_washed:"Immagine sovraesposta: i dettagli si perdono nel bianco.",th_v_flat:"Poco contrasto: gli elementi si confondono in piccolo.",th_v_dull:"Colori spenti: niente cattura l'occhio nella griglia.",th_v_soft:"Immagine poco nitida: sembra sfocata come miniatura.",th_v_busy:"Immagine carica: troppi elementi per leggerla in 1 secondo.",th_v_empty:"Immagine molto vuota: nessun punto d'ancoraggio visivo.",th_v_noface:"Nessun volto rilevato: uno sguardo umano aumenta i clic.",th_v_face:"Volto probabile rilevato.",th_v_lowres:"Risoluzione bassa: passa a 1280×720.",th_none:"Miniatura non misurabile (immagine non disponibile) — esclusa dal punteggio.",th_ok:"Immagine equilibrata: niente di bloccante sul piano visivo."},
 ru:{th_measured:"Реальные измерения изображения",th_note:"Измерено по твоей обложке, локально. Без оценок на глаз.",th_m_contrast:"Контраст",th_m_light:"Яркость",th_m_color:"Цвета",th_m_sharp:"Резкость",th_m_space:"Читаемость",th_m_human:"Присутствие человека",th_m_res:"Разрешение",th_v_dark:"Тёмная обложка: она растворяется в ленте YouTube.",th_v_washed:"Пересвеченное изображение: детали теряются в белом.",th_v_flat:"Низкий контраст: элементы сливаются в малом размере.",th_v_dull:"Тусклые цвета: ничто не цепляет взгляд в сетке.",th_v_soft:"Нерезкое изображение: в миниатюре выглядит размытым.",th_v_busy:"Перегруженное изображение: слишком много элементов на 1 секунду.",th_v_empty:"Очень пустое изображение: нет визуального якоря.",th_v_noface:"Лицо не найдено: человеческий взгляд повышает клики.",th_v_face:"Вероятно, найдено лицо.",th_v_lowres:"Низкое разрешение: перейди на 1280×720.",th_none:"Обложку измерить нельзя (изображение недоступно) — исключена из оценки.",th_ok:"Сбалансированное изображение: визуально ничего критичного."},
 ja:{th_measured:"画像の実測値",th_note:"あなたのサムネイルをローカルで実測。推定値ではありません。",th_m_contrast:"コントラスト",th_m_light:"明るさ",th_m_color:"色",th_m_sharp:"シャープさ",th_m_space:"視認性",th_m_human:"人の存在",th_m_res:"解像度",th_v_dark:"暗いサムネイル：YouTube のフィードで埋もれます。",th_v_washed:"露出過多：白飛びでディテールが失われています。",th_v_flat:"コントラスト不足：小さい表示で要素が溶け合います。",th_v_dull:"色がくすんでいます：一覧で目を引きません。",th_v_soft:"シャープさ不足：サムネイルではぼやけて見えます。",th_v_busy:"要素が多すぎます：1 秒で読み取れません。",th_v_empty:"情報が少なすぎます：視覚的な引っかかりがありません。",th_v_noface:"顔が検出されません：人の視線はクリックを増やします。",th_v_face:"顔らしきものを検出しました。",th_v_lowres:"解像度が低いです：1280×720 にしてください。",th_none:"サムネイルを測定できません（画像なし）— スコアから除外します。",th_ok:"バランスの取れた画像です：視覚面での問題はありません。"},
 ko:{th_measured:"이미지 실측값",th_note:"당신의 썸네일을 로컬에서 실제로 측정했습니다. 추정치가 아닙니다.",th_m_contrast:"대비",th_m_light:"밝기",th_m_color:"색상",th_m_sharp:"선명도",th_m_space:"가독성",th_m_human:"사람의 존재",th_m_res:"해상도",th_v_dark:"어두운 썸네일: YouTube 피드에서 묻힙니다.",th_v_washed:"과노출: 흰색에 디테일이 사라집니다.",th_v_flat:"대비가 낮음: 작은 크기에서 요소가 뭉쳐 보입니다.",th_v_dull:"색이 탁함: 목록에서 눈에 띄지 않습니다.",th_v_soft:"선명하지 않음: 썸네일에서 흐릿해 보입니다.",th_v_busy:"요소가 과다함: 1초 안에 읽히지 않습니다.",th_v_empty:"너무 비어 있음: 시선을 잡는 지점이 없습니다.",th_v_noface:"얼굴이 감지되지 않음: 사람의 시선은 클릭을 높입니다.",th_v_face:"얼굴로 보이는 영역이 감지되었습니다.",th_v_lowres:"해상도가 낮음: 1280×720으로 올리세요.",th_none:"썸네일을 측정할 수 없습니다(이미지 없음) — 점수에서 제외됩니다.",th_ok:"균형 잡힌 이미지입니다: 시각적으로 막히는 부분이 없습니다."},
 hi:{th_measured:"छवि की वास्तविक माप",th_note:"आपके थंबनेल पर स्थानीय रूप से मापा गया। कोई अनुमान नहीं।",th_m_contrast:"कंट्रास्ट",th_m_light:"चमक",th_m_color:"रंग",th_m_sharp:"तीक्ष्णता",th_m_space:"पठनीयता",th_m_human:"मानव उपस्थिति",th_m_res:"रिज़ॉल्यूशन",th_v_dark:"गहरा थंबनेल: YouTube फ़ीड में खो जाता है।",th_v_washed:"अत्यधिक उजला: विवरण सफ़ेदी में खो जाते हैं।",th_v_flat:"कम कंट्रास्ट: छोटे आकार में तत्व घुल जाते हैं।",th_v_dull:"फीके रंग: ग्रिड में कुछ भी ध्यान नहीं खींचता।",th_v_soft:"कम तीक्ष्ण: थंबनेल में धुंधला दिखता है।",th_v_busy:"बहुत भरा हुआ: 1 सेकंड में पढ़ा नहीं जा सकता।",th_v_empty:"बहुत खाली: कोई दृश्य पकड़ नहीं।",th_v_noface:"कोई चेहरा नहीं मिला: मानवीय दृष्टि क्लिक बढ़ाती है।",th_v_face:"संभावित चेहरा मिला।",th_v_lowres:"कम रिज़ॉल्यूशन: 1280×720 पर जाएँ।",th_none:"थंबनेल मापा नहीं जा सका (छवि अनुपलब्ध) — स्कोर से बाहर।",th_ok:"संतुलित छवि: दृश्य पक्ष में कुछ भी बाधक नहीं।"},
 zh:{th_measured:"图片实测数据",th_note:"在本地对你的缩略图实测，不是估算。",th_m_contrast:"对比度",th_m_light:"亮度",th_m_color:"色彩",th_m_sharp:"清晰度",th_m_space:"可读性",th_m_human:"人物出现",th_m_res:"分辨率",th_v_dark:"缩略图偏暗：在 YouTube 信息流里会被忽略。",th_v_washed:"曝光过度：细节被白色吞掉了。",th_v_flat:"对比度低：缩小后元素糊在一起。",th_v_dull:"色彩发灰：在列表里抓不住眼睛。",th_v_soft:"不够清晰：作为缩略图显得模糊。",th_v_busy:"元素过多：1 秒内看不完。",th_v_empty:"画面太空：没有视觉抓手。",th_v_noface:"未检测到人脸：人的目光能提升点击。",th_v_face:"检测到可能的人脸。",th_v_lowres:"分辨率偏低：请改用 1280×720。",th_none:"无法测量缩略图（图片不可用）——已从评分中剔除。",th_ok:"画面均衡：视觉方面没有阻碍。"},
 tr:{th_measured:"Gerçek görsel ölçümleri",th_note:"Küçük resminiz üzerinde yerel olarak ölçüldü. Tahmin değil.",th_m_contrast:"Kontrast",th_m_light:"Parlaklık",th_m_color:"Renkler",th_m_sharp:"Keskinlik",th_m_space:"Okunabilirlik",th_m_human:"İnsan varlığı",th_m_res:"Çözünürlük",th_v_dark:"Karanlık küçük resim: YouTube akışında kayboluyor.",th_v_washed:"Fazla pozlanmış: ayrıntılar beyazda kayboluyor.",th_v_flat:"Düşük kontrast: küçük boyutta öğeler birbirine karışıyor.",th_v_dull:"Soluk renkler: listede gözü hiçbir şey yakalamıyor.",th_v_soft:"Yeterince keskin değil: küçük resimde bulanık görünüyor.",th_v_busy:"Kalabalık görsel: 1 saniyede okunamayacak kadar çok öğe.",th_v_empty:"Çok boş görsel: görsel bir tutamak yok.",th_v_noface:"Yüz algılanmadı: insan bakışı tıklamayı artırır.",th_v_face:"Muhtemel yüz algılandı.",th_v_lowres:"Düşük çözünürlük: 1280×720'ye geçin.",th_none:"Küçük resim ölçülemiyor (görsel yok) — puandan çıkarıldı.",th_ok:"Dengeli görsel: görsel tarafta engel yok."},
 nl:{th_measured:"Echte metingen van de afbeelding",th_note:"Lokaal gemeten op je thumbnail. Geen schatting.",th_m_contrast:"Contrast",th_m_light:"Helderheid",th_m_color:"Kleuren",th_m_sharp:"Scherpte",th_m_space:"Leesbaarheid",th_m_human:"Menselijke aanwezigheid",th_m_res:"Resolutie",th_v_dark:"Donkere thumbnail: hij verdwijnt in de YouTube-feed.",th_v_washed:"Overbelicht: details verdwijnen in het wit.",th_v_flat:"Weinig contrast: elementen lopen in klein formaat door elkaar.",th_v_dull:"Vale kleuren: niets trekt het oog in het overzicht.",th_v_soft:"Niet scherp: als thumbnail lijkt het wazig.",th_v_busy:"Overvolle afbeelding: te veel elementen voor 1 seconde.",th_v_empty:"Erg lege afbeelding: geen visueel ankerpunt.",th_v_noface:"Geen gezicht gedetecteerd: een menselijke blik verhoogt de clicks.",th_v_face:"Waarschijnlijk gezicht gedetecteerd.",th_v_lowres:"Lage resolutie: ga naar 1280×720.",th_none:"Thumbnail niet meetbaar (afbeelding niet beschikbaar) — uitgesloten van de score.",th_ok:"Evenwichtige afbeelding: visueel niets blokkerends."}
};
Object.keys(THUMB_I18N).forEach(l=>{ if(I18N[l]){ for(const k in THUMB_I18N[l]){ if(!(k in I18N[l])) I18N[l][k]=THUMB_I18N[l][k]; } } });

/* ── WORKFLOW_I18N : écrans Publication / Suivi / Croissance — 14 langues ──
   Le parcours du copilote est Analyse → Coach → Corrections → Publication →
   Suivi → Croissance. Ces trois derniers écrans n'affichent que des valeurs
   mesurées ; ce qui n'est pas mesurable est étiqueté « Indisponible ». */
const WORKFLOW_I18N = {
 fr:{wf_na:"Indisponible",wf_na_note:"CTR réel, rétention et impressions demandent l'accès YouTube Analytics de ta chaîne. VidSpark ne les invente pas.",wf_refresh:"Actualiser",wf_ago:"il y a {n}",wf_d:"j",wf_h:"h",sec_publier:"Publier",sec_suivi:"Suivi",nav_publish:"Publication",nav_track:"Suivi",nav_growth:"Croissance",pb_hero:"Prêt à publier",pb_ready:"{n} vérifications sur {m}",pb_all_ok:"Tout est prêt : tu peux publier.",pb_pack:"Pack de publication",pb_pack_hint:"À coller tel quel dans YouTube Studio.",pb_copy:"Copier",pb_copied:"Copié",pb_dur:"Durée",pb_c_title:"Titre prêt",pb_c_desc:"Description prête",pb_c_thumb:"Miniature prête",pb_c_tags:"Tags renseignés",pb_c_chap:"Chapitres horodatés",pb_c_hash:"Hashtags présents",pb_c_link:"Lien ou appel à l'action",pb_f_title:"Repasse par le Titre avant de publier.",pb_f_desc:"Complète la description : 500 caractères minimum.",pb_f_thumb:"Reprends la miniature : c'est le premier levier de clic.",pb_f_tags:"Ajoute des tags dans YouTube Studio.",pb_f_chap:"Ajoute des chapitres (0:00, 1:24…) : ils retiennent le spectateur.",pb_f_hash:"Ajoute 2 ou 3 hashtags pertinents en fin de description.",pb_f_link:"Ajoute un lien ou un appel à l'action dans la description.",sv_hero:"Depuis la publication",sv_age:"publiée {ago}",sv_vs:"vs la moyenne de ta chaîne",sv_above:"au-dessus de ta moyenne",sv_below:"en dessous de ta moyenne",sv_equal:"dans ta moyenne",sv_delta:"Depuis ton dernier relevé",sv_first:"Premier relevé enregistré sur cet appareil. Reviens plus tard : la comparaison se fera avec celui-ci.",sv_speed:"vues/jour mesurées entre deux relevés",sv_hidden:"Non mesurable depuis l'extension",sv_snaps:"{n} relevés gardés sur cet appareil",sv_load:"Lecture des données YouTube…",sv_none:"Données YouTube indisponibles pour cette vidéo.",gr_hero:"Ta chaîne aujourd'hui",gr_load:"Lecture de ta chaîne…",gr_none:"Données de chaîne indisponibles.",gr_next:"Tes prochains leviers",gr_ok:"Rien de bloquant côté chaîne : garde ce rythme.",gr_tools:"Outils de croissance",gr_a_cadence:"Publie plus régulièrement",gr_w_cadence:"{v} jours entre tes vidéos : YouTube redistribue moins une chaîne irrégulière.",gr_a_tags:"Tague toutes tes vidéos",gr_w_tags:"Seules {v}% de tes vidéos ont des tags : tu perds des entrées de recherche.",gr_a_engage:"Fais réagir ton audience",gr_w_engage:"{v}% d'engagement moyen : demande explicitement un commentaire dans la vidéo.",gr_a_under:"Cette vidéo sous-performe",gr_w_under:"{v}% des vues moyennes de ta chaîne : le titre et la miniature sont les deux premiers leviers.",gr_a_worst:"Relance ta vidéo la plus faible",gr_w_worst:"« {v} » est ta vidéo la moins vue : un nouveau titre et une nouvelle miniature peuvent la relancer."},
 en:{wf_na:"Unavailable",wf_na_note:"Real CTR, retention and impressions require YouTube Analytics access to your channel. VidSpark does not make them up.",wf_refresh:"Refresh",wf_ago:"{n} ago",wf_d:"d",wf_h:"h",sec_publier:"Publish",sec_suivi:"Tracking",nav_publish:"Publishing",nav_track:"Tracking",nav_growth:"Growth",pb_hero:"Ready to publish",pb_ready:"{n} of {m} checks passed",pb_all_ok:"Everything is ready: you can publish.",pb_pack:"Publishing pack",pb_pack_hint:"Paste as-is into YouTube Studio.",pb_copy:"Copy",pb_copied:"Copied",pb_dur:"Duration",pb_c_title:"Title ready",pb_c_desc:"Description ready",pb_c_thumb:"Thumbnail ready",pb_c_tags:"Tags filled in",pb_c_chap:"Timestamped chapters",pb_c_hash:"Hashtags present",pb_c_link:"Link or call to action",pb_f_title:"Go back through Title before publishing.",pb_f_desc:"Flesh out the description: 500 characters minimum.",pb_f_thumb:"Rework the thumbnail: it's your first click lever.",pb_f_tags:"Add tags in YouTube Studio.",pb_f_chap:"Add chapters (0:00, 1:24…): they hold the viewer.",pb_f_hash:"Add 2 or 3 relevant hashtags at the end of the description.",pb_f_link:"Add a link or a call to action in the description.",sv_hero:"Since publishing",sv_age:"published {ago}",sv_vs:"vs your channel average",sv_above:"above your average",sv_below:"below your average",sv_equal:"in line with your average",sv_delta:"Since your last reading",sv_first:"First reading saved on this device. Come back later: the comparison will use this one.",sv_speed:"views/day measured between two readings",sv_hidden:"Not measurable from the extension",sv_snaps:"{n} readings kept on this device",sv_load:"Reading YouTube data…",sv_none:"YouTube data unavailable for this video.",gr_hero:"Your channel today",gr_load:"Reading your channel…",gr_none:"Channel data unavailable.",gr_next:"Your next levers",gr_ok:"Nothing blocking on the channel side: keep this pace.",gr_tools:"Growth tools",gr_a_cadence:"Publish more regularly",gr_w_cadence:"{v} days between your videos: YouTube redistributes an irregular channel less.",gr_a_tags:"Tag every video",gr_w_tags:"Only {v}% of your videos have tags: you're losing search entries.",gr_a_engage:"Get your audience reacting",gr_w_engage:"{v}% average engagement: explicitly ask for a comment in the video.",gr_a_under:"This video underperforms",gr_w_under:"{v}% of your channel's average views: title and thumbnail are the two first levers.",gr_a_worst:"Revive your weakest video",gr_w_worst:"“{v}” is your least-viewed video: a new title and thumbnail can restart it."},
 ar:{wf_na:"غير متوفر",wf_na_note:"معدل النقر الفعلي والاستبقاء ومرات الظهور تتطلب الوصول إلى YouTube Analytics لقناتك. VidSpark لا يختلقها.",wf_refresh:"تحديث",wf_ago:"قبل {n}",wf_d:"ي",wf_h:"س",sec_publier:"النشر",sec_suivi:"المتابعة",nav_publish:"النشر",nav_track:"المتابعة",nav_growth:"النمو",pb_hero:"جاهز للنشر",pb_ready:"{n} من {m} تحققات",pb_all_ok:"كل شيء جاهز: يمكنك النشر.",pb_pack:"حزمة النشر",pb_pack_hint:"الصقها كما هي في YouTube Studio.",pb_copy:"نسخ",pb_copied:"تم النسخ",pb_dur:"المدة",pb_c_title:"العنوان جاهز",pb_c_desc:"الوصف جاهز",pb_c_thumb:"الصورة المصغّرة جاهزة",pb_c_tags:"الوسوم مُدخلة",pb_c_chap:"فصول موقّتة",pb_c_hash:"هاشتاغات موجودة",pb_c_link:"رابط أو دعوة لإجراء",pb_f_title:"عد إلى العنوان قبل النشر.",pb_f_desc:"أكمل الوصف: 500 حرف على الأقل.",pb_f_thumb:"أعد تصميم الصورة المصغّرة: إنها أول رافعة للنقر.",pb_f_tags:"أضف وسومًا في YouTube Studio.",pb_f_chap:"أضف فصولًا (0:00، 1:24…): تحتفظ بالمشاهد.",pb_f_hash:"أضف 2 أو 3 هاشتاغات مناسبة في نهاية الوصف.",pb_f_link:"أضف رابطًا أو دعوة لإجراء في الوصف.",sv_hero:"منذ النشر",sv_age:"نُشر {ago}",sv_vs:"مقابل متوسط قناتك",sv_above:"أعلى من متوسطك",sv_below:"أقل من متوسطك",sv_equal:"في حدود متوسطك",sv_delta:"منذ قياسك الأخير",sv_first:"تم حفظ أول قياس على هذا الجهاز. عد لاحقًا: ستكون المقارنة معه.",sv_speed:"مشاهدات/يوم مقيسة بين قياسين",sv_hidden:"غير قابل للقياس من الإضافة",sv_snaps:"{n} قياسات محفوظة على هذا الجهاز",sv_load:"جارٍ قراءة بيانات يوتيوب…",sv_none:"بيانات يوتيوب غير متوفرة لهذا الفيديو.",gr_hero:"قناتك اليوم",gr_load:"جارٍ قراءة قناتك…",gr_none:"بيانات القناة غير متوفرة.",gr_next:"روافعك القادمة",gr_ok:"لا شيء يعيق القناة: حافظ على هذا الإيقاع.",gr_tools:"أدوات النمو",gr_a_cadence:"انشر بانتظام أكبر",gr_w_cadence:"{v} يومًا بين فيديوهاتك: يوتيوب يوزّع القناة غير المنتظمة بأقل قدر.",gr_a_tags:"ضع وسومًا لكل فيديوهاتك",gr_w_tags:"{v}% فقط من فيديوهاتك تحمل وسومًا: تخسر مداخل بحث.",gr_a_engage:"اجعل جمهورك يتفاعل",gr_w_engage:"{v}% متوسط التفاعل: اطلب تعليقًا بوضوح داخل الفيديو.",gr_a_under:"هذا الفيديو أداؤه أقل",gr_w_under:"{v}% من متوسط مشاهدات قناتك: العنوان والصورة المصغّرة أول رافعتين.",gr_a_worst:"أعد إطلاق أضعف فيديو لديك",gr_w_worst:"«{v}» هو أقل فيديوهاتك مشاهدة: عنوان وصورة مصغّرة جديدان قد يعيدان إطلاقه."},
 es:{wf_na:"No disponible",wf_na_note:"El CTR real, la retención y las impresiones requieren acceso a YouTube Analytics de tu canal. VidSpark no los inventa.",wf_refresh:"Actualizar",wf_ago:"hace {n}",wf_d:"d",wf_h:"h",sec_publier:"Publicar",sec_suivi:"Seguimiento",nav_publish:"Publicación",nav_track:"Seguimiento",nav_growth:"Crecimiento",pb_hero:"Listo para publicar",pb_ready:"{n} de {m} comprobaciones",pb_all_ok:"Todo está listo: puedes publicar.",pb_pack:"Paquete de publicación",pb_pack_hint:"Pégalo tal cual en YouTube Studio.",pb_copy:"Copiar",pb_copied:"Copiado",pb_dur:"Duración",pb_c_title:"Título listo",pb_c_desc:"Descripción lista",pb_c_thumb:"Miniatura lista",pb_c_tags:"Etiquetas rellenadas",pb_c_chap:"Capítulos con marca de tiempo",pb_c_hash:"Hashtags presentes",pb_c_link:"Enlace o llamada a la acción",pb_f_title:"Vuelve a pasar por el Título antes de publicar.",pb_f_desc:"Completa la descripción: 500 caracteres como mínimo.",pb_f_thumb:"Rehaz la miniatura: es tu primera palanca de clic.",pb_f_tags:"Añade etiquetas en YouTube Studio.",pb_f_chap:"Añade capítulos (0:00, 1:24…): retienen al espectador.",pb_f_hash:"Añade 2 o 3 hashtags relevantes al final de la descripción.",pb_f_link:"Añade un enlace o una llamada a la acción en la descripción.",sv_hero:"Desde la publicación",sv_age:"publicado {ago}",sv_vs:"vs la media de tu canal",sv_above:"por encima de tu media",sv_below:"por debajo de tu media",sv_equal:"en tu media",sv_delta:"Desde tu última medición",sv_first:"Primera medición guardada en este dispositivo. Vuelve más tarde: la comparación usará esta.",sv_speed:"vistas/día medidas entre dos mediciones",sv_hidden:"No medible desde la extensión",sv_snaps:"{n} mediciones guardadas en este dispositivo",sv_load:"Leyendo datos de YouTube…",sv_none:"Datos de YouTube no disponibles para este vídeo.",gr_hero:"Tu canal hoy",gr_load:"Leyendo tu canal…",gr_none:"Datos del canal no disponibles.",gr_next:"Tus próximas palancas",gr_ok:"Nada bloqueante en el canal: mantén este ritmo.",gr_tools:"Herramientas de crecimiento",gr_a_cadence:"Publica con más regularidad",gr_w_cadence:"{v} días entre tus vídeos: YouTube redistribuye menos un canal irregular.",gr_a_tags:"Etiqueta todos tus vídeos",gr_w_tags:"Solo el {v}% de tus vídeos tiene etiquetas: pierdes entradas de búsqueda.",gr_a_engage:"Haz reaccionar a tu audiencia",gr_w_engage:"{v}% de interacción media: pide explícitamente un comentario en el vídeo.",gr_a_under:"Este vídeo rinde por debajo",gr_w_under:"{v}% de las vistas medias de tu canal: título y miniatura son las dos primeras palancas.",gr_a_worst:"Relanza tu vídeo más débil",gr_w_worst:"«{v}» es tu vídeo menos visto: un nuevo título y una nueva miniatura pueden relanzarlo."},
 pt:{wf_na:"Indisponível",wf_na_note:"O CTR real, a retenção e as impressões exigem acesso ao YouTube Analytics do seu canal. O VidSpark não os inventa.",wf_refresh:"Atualizar",wf_ago:"há {n}",wf_d:"d",wf_h:"h",sec_publier:"Publicar",sec_suivi:"Acompanhamento",nav_publish:"Publicação",nav_track:"Acompanhamento",nav_growth:"Crescimento",pb_hero:"Pronto a publicar",pb_ready:"{n} de {m} verificações",pb_all_ok:"Está tudo pronto: pode publicar.",pb_pack:"Pacote de publicação",pb_pack_hint:"Cole tal como está no YouTube Studio.",pb_copy:"Copiar",pb_copied:"Copiado",pb_dur:"Duração",pb_c_title:"Título pronto",pb_c_desc:"Descrição pronta",pb_c_thumb:"Miniatura pronta",pb_c_tags:"Tags preenchidas",pb_c_chap:"Capítulos com marcação de tempo",pb_c_hash:"Hashtags presentes",pb_c_link:"Ligação ou chamada à ação",pb_f_title:"Volte ao Título antes de publicar.",pb_f_desc:"Complete a descrição: 500 caracteres no mínimo.",pb_f_thumb:"Refaça a miniatura: é a sua primeira alavanca de clique.",pb_f_tags:"Adicione tags no YouTube Studio.",pb_f_chap:"Adicione capítulos (0:00, 1:24…): eles seguram o espectador.",pb_f_hash:"Adicione 2 ou 3 hashtags relevantes no fim da descrição.",pb_f_link:"Adicione uma ligação ou chamada à ação na descrição.",sv_hero:"Desde a publicação",sv_age:"publicado {ago}",sv_vs:"vs a média do seu canal",sv_above:"acima da sua média",sv_below:"abaixo da sua média",sv_equal:"na sua média",sv_delta:"Desde a sua última leitura",sv_first:"Primeira leitura guardada neste dispositivo. Volte mais tarde: a comparação usará esta.",sv_speed:"visualizações/dia medidas entre duas leituras",sv_hidden:"Não mensurável a partir da extensão",sv_snaps:"{n} leituras guardadas neste dispositivo",sv_load:"A ler dados do YouTube…",sv_none:"Dados do YouTube indisponíveis para este vídeo.",gr_hero:"O seu canal hoje",gr_load:"A ler o seu canal…",gr_none:"Dados do canal indisponíveis.",gr_next:"As suas próximas alavancas",gr_ok:"Nada bloqueante no canal: mantenha este ritmo.",gr_tools:"Ferramentas de crescimento",gr_a_cadence:"Publique com mais regularidade",gr_w_cadence:"{v} dias entre os seus vídeos: o YouTube redistribui menos um canal irregular.",gr_a_tags:"Coloque tags em todos os vídeos",gr_w_tags:"Apenas {v}% dos seus vídeos têm tags: está a perder entradas de pesquisa.",gr_a_engage:"Faça a sua audiência reagir",gr_w_engage:"{v}% de envolvimento médio: peça explicitamente um comentário no vídeo.",gr_a_under:"Este vídeo tem desempenho abaixo",gr_w_under:"{v}% das visualizações médias do seu canal: título e miniatura são as duas primeiras alavancas.",gr_a_worst:"Relance o seu vídeo mais fraco",gr_w_worst:"«{v}» é o seu vídeo menos visto: um novo título e miniatura podem relançá-lo."},
 de:{wf_na:"Nicht verfügbar",wf_na_note:"Echte CTR, Wiedergabedauer und Impressionen brauchen Zugriff auf YouTube Analytics deines Kanals. VidSpark erfindet sie nicht.",wf_refresh:"Aktualisieren",wf_ago:"vor {n}",wf_d:"T",wf_h:"Std",sec_publier:"Veröffentlichen",sec_suivi:"Verfolgung",nav_publish:"Veröffentlichung",nav_track:"Verfolgung",nav_growth:"Wachstum",pb_hero:"Bereit zum Veröffentlichen",pb_ready:"{n} von {m} Prüfungen",pb_all_ok:"Alles bereit: du kannst veröffentlichen.",pb_pack:"Veröffentlichungspaket",pb_pack_hint:"So wie es ist in YouTube Studio einfügen.",pb_copy:"Kopieren",pb_copied:"Kopiert",pb_dur:"Dauer",pb_c_title:"Titel bereit",pb_c_desc:"Beschreibung bereit",pb_c_thumb:"Thumbnail bereit",pb_c_tags:"Tags eingetragen",pb_c_chap:"Kapitel mit Zeitmarken",pb_c_hash:"Hashtags vorhanden",pb_c_link:"Link oder Handlungsaufruf",pb_f_title:"Geh vor dem Veröffentlichen noch mal über den Titel.",pb_f_desc:"Ergänze die Beschreibung: mindestens 500 Zeichen.",pb_f_thumb:"Überarbeite das Thumbnail: es ist dein erster Klick-Hebel.",pb_f_tags:"Füge Tags in YouTube Studio hinzu.",pb_f_chap:"Füge Kapitel hinzu (0:00, 1:24…): sie halten die Zuschauer.",pb_f_hash:"Füge 2 oder 3 passende Hashtags am Ende der Beschreibung hinzu.",pb_f_link:"Füge einen Link oder Handlungsaufruf in die Beschreibung ein.",sv_hero:"Seit der Veröffentlichung",sv_age:"veröffentlicht {ago}",sv_vs:"vs dein Kanaldurchschnitt",sv_above:"über deinem Durchschnitt",sv_below:"unter deinem Durchschnitt",sv_equal:"in deinem Durchschnitt",sv_delta:"Seit deiner letzten Messung",sv_first:"Erste Messung auf diesem Gerät gespeichert. Komm später zurück: der Vergleich nutzt diese.",sv_speed:"Aufrufe/Tag, zwischen zwei Messungen gemessen",sv_hidden:"Aus der Erweiterung nicht messbar",sv_snaps:"{n} Messungen auf diesem Gerät gespeichert",sv_load:"YouTube-Daten werden gelesen…",sv_none:"YouTube-Daten für dieses Video nicht verfügbar.",gr_hero:"Dein Kanal heute",gr_load:"Dein Kanal wird gelesen…",gr_none:"Kanaldaten nicht verfügbar.",gr_next:"Deine nächsten Hebel",gr_ok:"Kanalseitig nichts Blockierendes: halte dieses Tempo.",gr_tools:"Wachstums-Werkzeuge",gr_a_cadence:"Veröffentliche regelmäßiger",gr_w_cadence:"{v} Tage zwischen deinen Videos: einen unregelmäßigen Kanal verteilt YouTube weniger.",gr_a_tags:"Tagge jedes Video",gr_w_tags:"Nur {v}% deiner Videos haben Tags: du verlierst Sucheinstiege.",gr_a_engage:"Bring dein Publikum zum Reagieren",gr_w_engage:"{v}% durchschnittliches Engagement: bitte im Video ausdrücklich um einen Kommentar.",gr_a_under:"Dieses Video liegt unter Wert",gr_w_under:"{v}% der durchschnittlichen Aufrufe deines Kanals: Titel und Thumbnail sind die zwei ersten Hebel.",gr_a_worst:"Belebe dein schwächstes Video",gr_w_worst:"„{v}“ ist dein am wenigsten gesehenes Video: ein neuer Titel und ein neues Thumbnail können es neu starten."},
 it:{wf_na:"Non disponibile",wf_na_note:"CTR reale, fidelizzazione e impressioni richiedono l'accesso a YouTube Analytics del tuo canale. VidSpark non li inventa.",wf_refresh:"Aggiorna",wf_ago:"{n} fa",wf_d:"g",wf_h:"h",sec_publier:"Pubblicare",sec_suivi:"Monitoraggio",nav_publish:"Pubblicazione",nav_track:"Monitoraggio",nav_growth:"Crescita",pb_hero:"Pronto a pubblicare",pb_ready:"{n} controlli su {m}",pb_all_ok:"Tutto pronto: puoi pubblicare.",pb_pack:"Pacchetto di pubblicazione",pb_pack_hint:"Da incollare così com'è in YouTube Studio.",pb_copy:"Copia",pb_copied:"Copiato",pb_dur:"Durata",pb_c_title:"Titolo pronto",pb_c_desc:"Descrizione pronta",pb_c_thumb:"Miniatura pronta",pb_c_tags:"Tag compilati",pb_c_chap:"Capitoli con timestamp",pb_c_hash:"Hashtag presenti",pb_c_link:"Link o invito all'azione",pb_f_title:"Ripassa dal Titolo prima di pubblicare.",pb_f_desc:"Completa la descrizione: minimo 500 caratteri.",pb_f_thumb:"Rifai la miniatura: è la tua prima leva di clic.",pb_f_tags:"Aggiungi tag in YouTube Studio.",pb_f_chap:"Aggiungi capitoli (0:00, 1:24…): trattengono lo spettatore.",pb_f_hash:"Aggiungi 2 o 3 hashtag pertinenti in fondo alla descrizione.",pb_f_link:"Aggiungi un link o un invito all'azione nella descrizione.",sv_hero:"Dalla pubblicazione",sv_age:"pubblicato {ago}",sv_vs:"vs la media del tuo canale",sv_above:"sopra la tua media",sv_below:"sotto la tua media",sv_equal:"nella tua media",sv_delta:"Dalla tua ultima rilevazione",sv_first:"Prima rilevazione salvata su questo dispositivo. Torna più tardi: il confronto userà questa.",sv_speed:"visualizzazioni/giorno misurate tra due rilevazioni",sv_hidden:"Non misurabile dall'estensione",sv_snaps:"{n} rilevazioni conservate su questo dispositivo",sv_load:"Lettura dei dati YouTube…",sv_none:"Dati YouTube non disponibili per questo video.",gr_hero:"Il tuo canale oggi",gr_load:"Lettura del tuo canale…",gr_none:"Dati del canale non disponibili.",gr_next:"Le tue prossime leve",gr_ok:"Niente di bloccante sul canale: mantieni questo ritmo.",gr_tools:"Strumenti di crescita",gr_a_cadence:"Pubblica più regolarmente",gr_w_cadence:"{v} giorni tra i tuoi video: YouTube ridistribuisce meno un canale irregolare.",gr_a_tags:"Metti i tag su tutti i video",gr_w_tags:"Solo il {v}% dei tuoi video ha tag: perdi ingressi dalla ricerca.",gr_a_engage:"Fai reagire il tuo pubblico",gr_w_engage:"{v}% di coinvolgimento medio: chiedi esplicitamente un commento nel video.",gr_a_under:"Questo video rende meno",gr_w_under:"{v}% delle visualizzazioni medie del tuo canale: titolo e miniatura sono le due prime leve.",gr_a_worst:"Rilancia il tuo video più debole",gr_w_worst:"«{v}» è il tuo video meno visto: un nuovo titolo e una nuova miniatura possono rilanciarlo."},
 ru:{wf_na:"Недоступно",wf_na_note:"Реальный CTR, удержание и показы требуют доступа к YouTube Analytics твоего канала. VidSpark их не придумывает.",wf_refresh:"Обновить",wf_ago:"{n} назад",wf_d:"д",wf_h:"ч",sec_publier:"Публикация",sec_suivi:"Отслеживание",nav_publish:"Публикация",nav_track:"Отслеживание",nav_growth:"Рост",pb_hero:"Готово к публикации",pb_ready:"{n} проверок из {m}",pb_all_ok:"Всё готово: можно публиковать.",pb_pack:"Пакет для публикации",pb_pack_hint:"Вставь как есть в YouTube Studio.",pb_copy:"Копировать",pb_copied:"Скопировано",pb_dur:"Длительность",pb_c_title:"Заголовок готов",pb_c_desc:"Описание готово",pb_c_thumb:"Обложка готова",pb_c_tags:"Теги заполнены",pb_c_chap:"Главы с таймкодами",pb_c_hash:"Хэштеги есть",pb_c_link:"Ссылка или призыв к действию",pb_f_title:"Перед публикацией вернись к заголовку.",pb_f_desc:"Дополни описание: минимум 500 символов.",pb_f_thumb:"Переделай обложку: это первый рычаг клика.",pb_f_tags:"Добавь теги в YouTube Studio.",pb_f_chap:"Добавь главы (0:00, 1:24…): они удерживают зрителя.",pb_f_hash:"Добавь 2–3 подходящих хэштега в конце описания.",pb_f_link:"Добавь ссылку или призыв к действию в описание.",sv_hero:"С момента публикации",sv_age:"опубликовано {ago}",sv_vs:"против среднего по каналу",sv_above:"выше твоего среднего",sv_below:"ниже твоего среднего",sv_equal:"в пределах среднего",sv_delta:"С последнего замера",sv_first:"Первый замер сохранён на этом устройстве. Вернись позже: сравнение будет с ним.",sv_speed:"просмотров/день, измерено между двумя замерами",sv_hidden:"Не измеряется из расширения",sv_snaps:"{n} замеров хранится на этом устройстве",sv_load:"Чтение данных YouTube…",sv_none:"Данные YouTube для этого видео недоступны.",gr_hero:"Твой канал сегодня",gr_load:"Чтение твоего канала…",gr_none:"Данные канала недоступны.",gr_next:"Твои следующие рычаги",gr_ok:"Со стороны канала ничего критичного: держи этот ритм.",gr_tools:"Инструменты роста",gr_a_cadence:"Публикуй регулярнее",gr_w_cadence:"{v} дней между видео: нерегулярный канал YouTube продвигает слабее.",gr_a_tags:"Добавь теги ко всем видео",gr_w_tags:"Теги есть лишь у {v}% твоих видео: ты теряешь входы из поиска.",gr_a_engage:"Заставь аудиторию реагировать",gr_w_engage:"{v}% средней вовлечённости: прямо попроси комментарий в видео.",gr_a_under:"Это видео недорабатывает",gr_w_under:"{v}% от средних просмотров канала: заголовок и обложка — первые два рычага.",gr_a_worst:"Перезапусти самое слабое видео",gr_w_worst:"«{v}» — твоё наименее просматриваемое видео: новый заголовок и обложка могут его перезапустить."},
 ja:{wf_na:"利用不可",wf_na_note:"実際の CTR・視聴維持率・インプレッションは、あなたのチャンネルの YouTube Analytics へのアクセスが必要です。VidSpark は数値を作りません。",wf_refresh:"更新",wf_ago:"{n}前",wf_d:"日",wf_h:"時間",sec_publier:"公開",sec_suivi:"追跡",nav_publish:"公開",nav_track:"追跡",nav_growth:"成長",pb_hero:"公開の準備",pb_ready:"{m} 項目中 {n} 項目",pb_all_ok:"準備完了：公開できます。",pb_pack:"公開パック",pb_pack_hint:"そのまま YouTube Studio に貼り付けてください。",pb_copy:"コピー",pb_copied:"コピーしました",pb_dur:"長さ",pb_c_title:"タイトル準備完了",pb_c_desc:"説明文準備完了",pb_c_thumb:"サムネイル準備完了",pb_c_tags:"タグ入力済み",pb_c_chap:"タイムスタンプ付きチャプター",pb_c_hash:"ハッシュタグあり",pb_c_link:"リンクまたは行動喚起",pb_f_title:"公開前にタイトルを見直してください。",pb_f_desc:"説明文を充実させてください：最低 500 文字。",pb_f_thumb:"サムネイルを作り直してください：クリックの第一のレバーです。",pb_f_tags:"YouTube Studio でタグを追加してください。",pb_f_chap:"チャプター（0:00、1:24…）を追加：視聴者を引き留めます。",pb_f_hash:"説明文の末尾に関連ハッシュタグを 2〜3 個追加してください。",pb_f_link:"説明文にリンクまたは行動喚起を追加してください。",sv_hero:"公開以降",sv_age:"{ago}に公開",sv_vs:"チャンネル平均との比較",sv_above:"平均より上",sv_below:"平均より下",sv_equal:"平均どおり",sv_delta:"前回の計測から",sv_first:"最初の計測をこの端末に保存しました。後でまた開くと、この値と比較します。",sv_speed:"2 回の計測から算出した 1 日あたりの再生数",sv_hidden:"拡張機能からは計測できません",sv_snaps:"この端末に {n} 件の計測を保存",sv_load:"YouTube のデータを読み込み中…",sv_none:"この動画の YouTube データは利用できません。",gr_hero:"今日のあなたのチャンネル",gr_load:"チャンネルを読み込み中…",gr_none:"チャンネルのデータは利用できません。",gr_next:"次のレバー",gr_ok:"チャンネル側に問題はありません：このペースを維持してください。",gr_tools:"成長ツール",gr_a_cadence:"もっと定期的に投稿する",gr_w_cadence:"投稿間隔が {v} 日：不規則なチャンネルは配信されにくくなります。",gr_a_tags:"すべての動画にタグを付ける",gr_w_tags:"タグがある動画は {v}% だけ：検索の入口を失っています。",gr_a_engage:"視聴者を反応させる",gr_w_engage:"平均エンゲージメント {v}%：動画内でコメントを明確に呼びかけてください。",gr_a_under:"この動画は伸び不足です",gr_w_under:"チャンネル平均再生数の {v}%：タイトルとサムネイルが最初の 2 つのレバーです。",gr_a_worst:"最も弱い動画を立て直す",gr_w_worst:"「{v}」が最も再生数の少ない動画です：新しいタイトルとサムネイルで再起動できます。"},
 ko:{wf_na:"사용 불가",wf_na_note:"실제 CTR·시청 지속률·노출수는 채널의 YouTube Analytics 접근이 필요합니다. VidSpark는 값을 만들어내지 않습니다.",wf_refresh:"새로고침",wf_ago:"{n} 전",wf_d:"일",wf_h:"시간",sec_publier:"게시",sec_suivi:"추적",nav_publish:"게시",nav_track:"추적",nav_growth:"성장",pb_hero:"게시 준비",pb_ready:"{m}개 중 {n}개 확인",pb_all_ok:"모두 준비되었습니다: 게시할 수 있습니다.",pb_pack:"게시 패키지",pb_pack_hint:"YouTube Studio에 그대로 붙여넣으세요.",pb_copy:"복사",pb_copied:"복사됨",pb_dur:"길이",pb_c_title:"제목 준비됨",pb_c_desc:"설명 준비됨",pb_c_thumb:"썸네일 준비됨",pb_c_tags:"태그 입력됨",pb_c_chap:"타임스탬프 챕터",pb_c_hash:"해시태그 있음",pb_c_link:"링크 또는 행동 유도",pb_f_title:"게시하기 전에 제목을 다시 확인하세요.",pb_f_desc:"설명을 보완하세요: 최소 500자.",pb_f_thumb:"썸네일을 다시 만드세요: 클릭의 첫 번째 레버입니다.",pb_f_tags:"YouTube Studio에서 태그를 추가하세요.",pb_f_chap:"챕터(0:00, 1:24…)를 추가하세요: 시청자를 붙잡습니다.",pb_f_hash:"설명 끝에 관련 해시태그 2~3개를 추가하세요.",pb_f_link:"설명에 링크나 행동 유도를 추가하세요.",sv_hero:"게시 이후",sv_age:"{ago} 게시",sv_vs:"내 채널 평균과 비교",sv_above:"내 평균보다 높음",sv_below:"내 평균보다 낮음",sv_equal:"내 평균 수준",sv_delta:"지난 측정 이후",sv_first:"이 기기에 첫 측정을 저장했습니다. 나중에 다시 오면 이 값과 비교합니다.",sv_speed:"두 측정 사이에서 계산한 일일 조회수",sv_hidden:"확장에서는 측정할 수 없습니다",sv_snaps:"이 기기에 {n}개의 측정 보관",sv_load:"YouTube 데이터를 읽는 중…",sv_none:"이 영상의 YouTube 데이터를 사용할 수 없습니다.",gr_hero:"오늘의 내 채널",gr_load:"채널을 읽는 중…",gr_none:"채널 데이터를 사용할 수 없습니다.",gr_next:"다음 레버",gr_ok:"채널 쪽에 막히는 것은 없습니다: 이 속도를 유지하세요.",gr_tools:"성장 도구",gr_a_cadence:"더 규칙적으로 게시하기",gr_w_cadence:"영상 간격 {v}일: 불규칙한 채널은 YouTube가 덜 배포합니다.",gr_a_tags:"모든 영상에 태그 달기",gr_w_tags:"태그가 있는 영상이 {v}%뿐입니다: 검색 유입을 놓치고 있습니다.",gr_a_engage:"시청자가 반응하게 만들기",gr_w_engage:"평균 참여율 {v}%: 영상 안에서 댓글을 분명히 요청하세요.",gr_a_under:"이 영상은 성과가 낮습니다",gr_w_under:"채널 평균 조회수의 {v}%: 제목과 썸네일이 첫 두 레버입니다.",gr_a_worst:"가장 약한 영상 살리기",gr_w_worst:"‘{v}’이(가) 조회수가 가장 낮은 영상입니다: 새 제목과 썸네일로 되살릴 수 있습니다."},
 hi:{wf_na:"अनुपलब्ध",wf_na_note:"वास्तविक CTR, रिटेंशन और इंप्रेशन के लिए आपके चैनल के YouTube Analytics की पहुँच चाहिए। VidSpark इन्हें गढ़ता नहीं।",wf_refresh:"रिफ़्रेश",wf_ago:"{n} पहले",wf_d:"दि",wf_h:"घं",sec_publier:"प्रकाशन",sec_suivi:"ट्रैकिंग",nav_publish:"प्रकाशन",nav_track:"ट्रैकिंग",nav_growth:"वृद्धि",pb_hero:"प्रकाशन के लिए तैयार",pb_ready:"{m} में से {n} जाँच",pb_all_ok:"सब तैयार है: आप प्रकाशित कर सकते हैं।",pb_pack:"प्रकाशन पैक",pb_pack_hint:"YouTube Studio में जैसा है वैसा चिपकाएँ।",pb_copy:"कॉपी",pb_copied:"कॉपी हो गया",pb_dur:"अवधि",pb_c_title:"शीर्षक तैयार",pb_c_desc:"विवरण तैयार",pb_c_thumb:"थंबनेल तैयार",pb_c_tags:"टैग भरे गए",pb_c_chap:"समय-चिह्नित अध्याय",pb_c_hash:"हैशटैग मौजूद",pb_c_link:"लिंक या कार्रवाई का आह्वान",pb_f_title:"प्रकाशित करने से पहले शीर्षक पर लौटें।",pb_f_desc:"विवरण पूरा करें: कम से कम 500 अक्षर।",pb_f_thumb:"थंबनेल दोबारा बनाएँ: यह क्लिक का पहला लीवर है।",pb_f_tags:"YouTube Studio में टैग जोड़ें।",pb_f_chap:"अध्याय जोड़ें (0:00, 1:24…): ये दर्शक को रोकते हैं।",pb_f_hash:"विवरण के अंत में 2-3 प्रासंगिक हैशटैग जोड़ें।",pb_f_link:"विवरण में एक लिंक या कार्रवाई का आह्वान जोड़ें।",sv_hero:"प्रकाशन के बाद से",sv_age:"{ago} प्रकाशित",sv_vs:"आपके चैनल औसत की तुलना में",sv_above:"आपके औसत से ऊपर",sv_below:"आपके औसत से नीचे",sv_equal:"आपके औसत में",sv_delta:"आपके पिछले माप के बाद से",sv_first:"पहला माप इस डिवाइस पर सहेजा गया। बाद में लौटें: तुलना इसी से होगी।",sv_speed:"दो मापों के बीच मापे गए दृश्य/दिन",sv_hidden:"एक्सटेंशन से मापा नहीं जा सकता",sv_snaps:"इस डिवाइस पर {n} माप रखे गए",sv_load:"YouTube डेटा पढ़ रहे हैं…",sv_none:"इस वीडियो के लिए YouTube डेटा अनुपलब्ध।",gr_hero:"आज आपका चैनल",gr_load:"आपका चैनल पढ़ रहे हैं…",gr_none:"चैनल डेटा अनुपलब्ध।",gr_next:"आपके अगले लीवर",gr_ok:"चैनल की तरफ कुछ अटका नहीं है: यही रफ़्तार बनाए रखें।",gr_tools:"वृद्धि उपकरण",gr_a_cadence:"अधिक नियमित रूप से प्रकाशित करें",gr_w_cadence:"आपके वीडियो के बीच {v} दिन: अनियमित चैनल को YouTube कम बाँटता है।",gr_a_tags:"सभी वीडियो पर टैग लगाएँ",gr_w_tags:"आपके केवल {v}% वीडियो में टैग हैं: आप खोज से आने वाले दर्शक खो रहे हैं।",gr_a_engage:"अपने दर्शकों को प्रतिक्रिया दिलाएँ",gr_w_engage:"{v}% औसत जुड़ाव: वीडियो में स्पष्ट रूप से टिप्पणी माँगें।",gr_a_under:"यह वीडियो कमजोर प्रदर्शन कर रहा है",gr_w_under:"आपके चैनल के औसत दृश्यों का {v}%: शीर्षक और थंबनेल पहले दो लीवर हैं।",gr_a_worst:"अपने सबसे कमजोर वीडियो को फिर चलाएँ",gr_w_worst:"«{v}» आपका सबसे कम देखा गया वीडियो है: नया शीर्षक और थंबनेल इसे फिर चला सकते हैं।"},
 zh:{wf_na:"不可用",wf_na_note:"真实点击率、观看时长和展示次数需要你频道的 YouTube Analytics 权限。VidSpark 不会凭空造数。",wf_refresh:"刷新",wf_ago:"{n}前",wf_d:"天",wf_h:"小时",sec_publier:"发布",sec_suivi:"追踪",nav_publish:"发布",nav_track:"追踪",nav_growth:"增长",pb_hero:"可以发布了吗",pb_ready:"{m} 项中通过 {n} 项",pb_all_ok:"一切就绪：可以发布。",pb_pack:"发布素材包",pb_pack_hint:"原样粘贴到 YouTube Studio。",pb_copy:"复制",pb_copied:"已复制",pb_dur:"时长",pb_c_title:"标题就绪",pb_c_desc:"简介就绪",pb_c_thumb:"缩略图就绪",pb_c_tags:"标签已填",pb_c_chap:"带时间戳的章节",pb_c_hash:"含话题标签",pb_c_link:"链接或行动号召",pb_f_title:"发布前再回到标题看看。",pb_f_desc:"补全简介：至少 500 字符。",pb_f_thumb:"重做缩略图：它是点击的第一个杠杆。",pb_f_tags:"在 YouTube Studio 里补上标签。",pb_f_chap:"加上章节（0:00、1:24…）：能留住观众。",pb_f_hash:"在简介末尾加 2 到 3 个相关话题标签。",pb_f_link:"在简介里加一个链接或行动号召。",sv_hero:"发布以来",sv_age:"{ago}发布",sv_vs:"对比你的频道均值",sv_above:"高于你的均值",sv_below:"低于你的均值",sv_equal:"处在你的均值",sv_delta:"自上次测量以来",sv_first:"已在本设备保存第一次测量。稍后回来，将与它对比。",sv_speed:"两次测量之间算出的每日观看量",sv_hidden:"扩展内无法测量",sv_snaps:"本设备保存了 {n} 次测量",sv_load:"正在读取 YouTube 数据…",sv_none:"该视频的 YouTube 数据不可用。",gr_hero:"你的频道现状",gr_load:"正在读取你的频道…",gr_none:"频道数据不可用。",gr_next:"你的下一批杠杆",gr_ok:"频道层面没有阻碍：保持这个节奏。",gr_tools:"增长工具",gr_a_cadence:"更规律地发布",gr_w_cadence:"两条视频间隔 {v} 天：不规律的频道，YouTube 分发得更少。",gr_a_tags:"给每条视频都加标签",gr_w_tags:"只有 {v}% 的视频有标签：你在丢失搜索入口。",gr_a_engage:"让观众有反应",gr_w_engage:"平均互动率 {v}%：在视频里明确请求评论。",gr_a_under:"这条视频表现偏低",gr_w_under:"只有频道平均观看量的 {v}%：标题和缩略图是最先的两个杠杆。",gr_a_worst:"救活你最弱的视频",gr_w_worst:"「{v}」是你观看量最低的视频：换标题和缩略图可以重启它。"},
 tr:{wf_na:"Kullanılamıyor",wf_na_note:"Gerçek TO, izlenme süresi ve gösterimler kanalının YouTube Analytics erişimini gerektirir. VidSpark bunları uydurmaz.",wf_refresh:"Yenile",wf_ago:"{n} önce",wf_d:"g",wf_h:"sa",sec_publier:"Yayınla",sec_suivi:"Takip",nav_publish:"Yayınlama",nav_track:"Takip",nav_growth:"Büyüme",pb_hero:"Yayına hazır",pb_ready:"{m} kontrolden {n} tanesi",pb_all_ok:"Her şey hazır: yayınlayabilirsin.",pb_pack:"Yayın paketi",pb_pack_hint:"YouTube Studio'ya olduğu gibi yapıştır.",pb_copy:"Kopyala",pb_copied:"Kopyalandı",pb_dur:"Süre",pb_c_title:"Başlık hazır",pb_c_desc:"Açıklama hazır",pb_c_thumb:"Küçük resim hazır",pb_c_tags:"Etiketler girildi",pb_c_chap:"Zaman damgalı bölümler",pb_c_hash:"Hashtag var",pb_c_link:"Bağlantı veya eylem çağrısı",pb_f_title:"Yayınlamadan önce Başlığa geri dön.",pb_f_desc:"Açıklamayı tamamla: en az 500 karakter.",pb_f_thumb:"Küçük resmi yenile: ilk tıklama kaldıracın.",pb_f_tags:"YouTube Studio'da etiket ekle.",pb_f_chap:"Bölüm ekle (0:00, 1:24…): izleyiciyi tutar.",pb_f_hash:"Açıklamanın sonuna 2-3 ilgili hashtag ekle.",pb_f_link:"Açıklamaya bir bağlantı veya eylem çağrısı ekle.",sv_hero:"Yayından bu yana",sv_age:"{ago} yayınlandı",sv_vs:"kanal ortalamana kıyasla",sv_above:"ortalamanın üstünde",sv_below:"ortalamanın altında",sv_equal:"ortalamanda",sv_delta:"Son ölçümünden bu yana",sv_first:"İlk ölçüm bu cihaza kaydedildi. Sonra dön: karşılaştırma bununla yapılacak.",sv_speed:"iki ölçüm arasında ölçülen günlük görüntüleme",sv_hidden:"Uzantıdan ölçülemez",sv_snaps:"Bu cihazda {n} ölçüm saklanıyor",sv_load:"YouTube verileri okunuyor…",sv_none:"Bu video için YouTube verileri kullanılamıyor.",gr_hero:"Kanalın bugün",gr_load:"Kanalın okunuyor…",gr_none:"Kanal verileri kullanılamıyor.",gr_next:"Sıradaki kaldıraçların",gr_ok:"Kanal tarafında engel yok: bu tempoyu koru.",gr_tools:"Büyüme araçları",gr_a_cadence:"Daha düzenli yayınla",gr_w_cadence:"Videoların arasında {v} gün: düzensiz bir kanalı YouTube daha az dağıtır.",gr_a_tags:"Her videoya etiket koy",gr_w_tags:"Videolarının yalnızca %{v}'inde etiket var: arama girişlerini kaybediyorsun.",gr_a_engage:"İzleyicini tepki vermeye ittir",gr_w_engage:"Ortalama %{v} etkileşim: videoda açıkça yorum iste.",gr_a_under:"Bu video düşük performans gösteriyor",gr_w_under:"Kanal ortalama görüntülemenin %{v}'i: başlık ve küçük resim ilk iki kaldıraç.",gr_a_worst:"En zayıf videonu canlandır",gr_w_worst:"“{v}” en az izlenen videon: yeni bir başlık ve küçük resim onu yeniden başlatabilir."},
 nl:{wf_na:"Niet beschikbaar",wf_na_note:"Echte CTR, kijkersbehoud en impressies vereisen toegang tot YouTube Analytics van je kanaal. VidSpark verzint ze niet.",wf_refresh:"Verversen",wf_ago:"{n} geleden",wf_d:"d",wf_h:"u",sec_publier:"Publiceren",sec_suivi:"Opvolging",nav_publish:"Publicatie",nav_track:"Opvolging",nav_growth:"Groei",pb_hero:"Klaar om te publiceren",pb_ready:"{n} van {m} controles",pb_all_ok:"Alles is klaar: je kunt publiceren.",pb_pack:"Publicatiepakket",pb_pack_hint:"Plak het zo in YouTube Studio.",pb_copy:"Kopiëren",pb_copied:"Gekopieerd",pb_dur:"Duur",pb_c_title:"Titel klaar",pb_c_desc:"Beschrijving klaar",pb_c_thumb:"Thumbnail klaar",pb_c_tags:"Tags ingevuld",pb_c_chap:"Kapittels met tijdcodes",pb_c_hash:"Hashtags aanwezig",pb_c_link:"Link of call-to-action",pb_f_title:"Loop de titel nog eens na voor je publiceert.",pb_f_desc:"Vul de beschrijving aan: minimaal 500 tekens.",pb_f_thumb:"Werk de thumbnail bij: het is je eerste klik-hefboom.",pb_f_tags:"Voeg tags toe in YouTube Studio.",pb_f_chap:"Voeg kapittels toe (0:00, 1:24…): ze houden de kijker vast.",pb_f_hash:"Voeg 2 of 3 relevante hashtags toe onderaan de beschrijving.",pb_f_link:"Voeg een link of call-to-action toe in de beschrijving.",sv_hero:"Sinds de publicatie",sv_age:"{ago} gepubliceerd",sv_vs:"vs je kanaalgemiddelde",sv_above:"boven je gemiddelde",sv_below:"onder je gemiddelde",sv_equal:"op je gemiddelde",sv_delta:"Sinds je laatste meting",sv_first:"Eerste meting op dit apparaat opgeslagen. Kom later terug: de vergelijking gebruikt deze.",sv_speed:"weergaven/dag, gemeten tussen twee metingen",sv_hidden:"Niet meetbaar vanuit de extensie",sv_snaps:"{n} metingen bewaard op dit apparaat",sv_load:"YouTube-gegevens worden gelezen…",sv_none:"YouTube-gegevens niet beschikbaar voor deze video.",gr_hero:"Je kanaal vandaag",gr_load:"Je kanaal wordt gelezen…",gr_none:"Kanaalgegevens niet beschikbaar.",gr_next:"Je volgende hefbomen",gr_ok:"Niets blokkerends aan de kanaalkant: hou dit tempo aan.",gr_tools:"Groeitools",gr_a_cadence:"Publiceer regelmatiger",gr_w_cadence:"{v} dagen tussen je video's: een onregelmatig kanaal verspreidt YouTube minder.",gr_a_tags:"Tag al je video's",gr_w_tags:"Slechts {v}% van je video's heeft tags: je verliest zoekingangen.",gr_a_engage:"Laat je publiek reageren",gr_w_engage:"{v}% gemiddelde betrokkenheid: vraag in de video expliciet om een reactie.",gr_a_under:"Deze video presteert onder de maat",gr_w_under:"{v}% van de gemiddelde weergaven van je kanaal: titel en thumbnail zijn de eerste twee hefbomen.",gr_a_worst:"Blaas je zwakste video nieuw leven in",gr_w_worst:"“{v}” is je minst bekeken video: een nieuwe titel en thumbnail kunnen hem herstarten."}
};
Object.keys(WORKFLOW_I18N).forEach(l=>{ if(I18N[l]){ for(const k in WORKFLOW_I18N[l]){ if(!(k in I18N[l])) I18N[l][k]=WORKFLOW_I18N[l][k]; } } });

/* ── UI_I18N : textes d'interface qui étaient écrits en dur en français
   (bandeaux de chaîne, quota du plan gratuit, aperçus verrouillés) — 14 langues ── */
const UI_I18N = {
 fr:{fl_title:"Limite quotidienne atteinte",fl_msg:"Le plan Gratuit permet {n} analyses par jour. Passe à Pro pour des analyses illimitées.",ch_denied_t:"Chaîne non autorisée",ch_denied_m:"Cette chaîne YouTube n'est pas connectée à ton compte VidSpark AI.",ch_manage:"Gérer mes chaînes",ch_recode:"Entrer un autre code",ch_add_t:"Ajoute ta chaîne",ch_add_m:"Va sur ton tableau de bord pour ajouter la ou les chaînes où l'extension doit fonctionner.",ch_connect_t:"Connecter ta chaîne",ch_connect_m:"Colle l'URL de ta chaîne YouTube.",ch_save:"Enregistrer ma chaîne",lk_hidden:"Contenu Pro masqué",lk_all:"Passe à Pro pour tout débloquer.",lk_more:"Encore {n} avec Pro",lk_preview:"Aperçu gratuit"},
 en:{fl_title:"Daily limit reached",fl_msg:"The Free plan allows {n} analyses per day. Go Pro for unlimited analyses.",ch_denied_t:"Channel not allowed",ch_denied_m:"This YouTube channel is not connected to your VidSpark AI account.",ch_manage:"Manage my channels",ch_recode:"Enter another code",ch_add_t:"Add your channel",ch_add_m:"Go to your dashboard to add the channel(s) where the extension should work.",ch_connect_t:"Connect your channel",ch_connect_m:"Paste your YouTube channel URL.",ch_save:"Save my channel",lk_hidden:"Pro content hidden",lk_all:"Go Pro to unlock everything.",lk_more:"{n} more with Pro",lk_preview:"Free preview"},
 ar:{fl_title:"تم الوصول إلى الحد اليومي",fl_msg:"تتيح الخطة المجانية {n} تحليلات يوميًا. انتقل إلى Pro لتحليلات غير محدودة.",ch_denied_t:"قناة غير مصرّح بها",ch_denied_m:"قناة يوتيوب هذه غير مرتبطة بحسابك في VidSpark AI.",ch_manage:"إدارة قنواتي",ch_recode:"إدخال كود آخر",ch_add_t:"أضف قناتك",ch_add_m:"اذهب إلى لوحة التحكم لإضافة القناة أو القنوات التي يجب أن تعمل عليها الإضافة.",ch_connect_t:"اربط قناتك",ch_connect_m:"الصق رابط قناتك على يوتيوب.",ch_save:"حفظ قناتي",lk_hidden:"محتوى Pro مخفي",lk_all:"انتقل إلى Pro لفتح كل شيء.",lk_more:"{n} إضافية مع Pro",lk_preview:"معاينة مجانية"},
 es:{fl_title:"Límite diario alcanzado",fl_msg:"El plan Gratis permite {n} análisis al día. Pasa a Pro para análisis ilimitados.",ch_denied_t:"Canal no autorizado",ch_denied_m:"Este canal de YouTube no está conectado a tu cuenta de VidSpark AI.",ch_manage:"Gestionar mis canales",ch_recode:"Introducir otro código",ch_add_t:"Añade tu canal",ch_add_m:"Ve a tu panel para añadir el canal o los canales donde debe funcionar la extensión.",ch_connect_t:"Conectar tu canal",ch_connect_m:"Pega la URL de tu canal de YouTube.",ch_save:"Guardar mi canal",lk_hidden:"Contenido Pro oculto",lk_all:"Pasa a Pro para desbloquear todo.",lk_more:"{n} más con Pro",lk_preview:"Vista previa gratis"},
 pt:{fl_title:"Limite diário atingido",fl_msg:"O plano Gratuito permite {n} análises por dia. Passe para Pro para análises ilimitadas.",ch_denied_t:"Canal não autorizado",ch_denied_m:"Este canal do YouTube não está ligado à sua conta VidSpark AI.",ch_manage:"Gerir os meus canais",ch_recode:"Introduzir outro código",ch_add_t:"Adicione o seu canal",ch_add_m:"Vá ao seu painel para adicionar o canal ou os canais onde a extensão deve funcionar.",ch_connect_t:"Ligar o seu canal",ch_connect_m:"Cole o URL do seu canal do YouTube.",ch_save:"Guardar o meu canal",lk_hidden:"Conteúdo Pro oculto",lk_all:"Passe para Pro para desbloquear tudo.",lk_more:"Mais {n} com Pro",lk_preview:"Pré-visualização gratuita"},
 de:{fl_title:"Tageslimit erreicht",fl_msg:"Der Gratis-Tarif erlaubt {n} Analysen pro Tag. Mit Pro sind sie unbegrenzt.",ch_denied_t:"Kanal nicht freigegeben",ch_denied_m:"Dieser YouTube-Kanal ist nicht mit deinem VidSpark-AI-Konto verbunden.",ch_manage:"Meine Kanäle verwalten",ch_recode:"Anderen Code eingeben",ch_add_t:"Füge deinen Kanal hinzu",ch_add_m:"Öffne dein Dashboard, um die Kanäle hinzuzufügen, auf denen die Erweiterung arbeiten soll.",ch_connect_t:"Kanal verbinden",ch_connect_m:"Füge die URL deines YouTube-Kanals ein.",ch_save:"Kanal speichern",lk_hidden:"Pro-Inhalt verborgen",lk_all:"Mit Pro alles freischalten.",lk_more:"{n} weitere mit Pro",lk_preview:"Gratis-Vorschau"},
 it:{fl_title:"Limite giornaliero raggiunto",fl_msg:"Il piano Gratuito consente {n} analisi al giorno. Passa a Pro per analisi illimitate.",ch_denied_t:"Canale non autorizzato",ch_denied_m:"Questo canale YouTube non è collegato al tuo account VidSpark AI.",ch_manage:"Gestisci i miei canali",ch_recode:"Inserisci un altro codice",ch_add_t:"Aggiungi il tuo canale",ch_add_m:"Vai sulla tua dashboard per aggiungere il canale o i canali su cui l'estensione deve funzionare.",ch_connect_t:"Collega il tuo canale",ch_connect_m:"Incolla l'URL del tuo canale YouTube.",ch_save:"Salva il mio canale",lk_hidden:"Contenuto Pro nascosto",lk_all:"Passa a Pro per sbloccare tutto.",lk_more:"Altri {n} con Pro",lk_preview:"Anteprima gratuita"},
 ru:{fl_title:"Дневной лимит достигнут",fl_msg:"Бесплатный план даёт {n} анализа в день. Перейди на Pro для неограниченных анализов.",ch_denied_t:"Канал не разрешён",ch_denied_m:"Этот канал YouTube не привязан к твоему аккаунту VidSpark AI.",ch_manage:"Мои каналы",ch_recode:"Ввести другой код",ch_add_t:"Добавь свой канал",ch_add_m:"Открой панель управления и добавь каналы, на которых должно работать расширение.",ch_connect_t:"Подключить канал",ch_connect_m:"Вставь ссылку на свой канал YouTube.",ch_save:"Сохранить канал",lk_hidden:"Контент Pro скрыт",lk_all:"Перейди на Pro, чтобы открыть всё.",lk_more:"Ещё {n} с Pro",lk_preview:"Бесплатный просмотр"},
 ja:{fl_title:"1日の上限に達しました",fl_msg:"無料プランは1日 {n} 回まで分析できます。Pro なら無制限です。",ch_denied_t:"許可されていないチャンネル",ch_denied_m:"この YouTube チャンネルは VidSpark AI アカウントに接続されていません。",ch_manage:"チャンネルを管理",ch_recode:"別のコードを入力",ch_add_t:"チャンネルを追加",ch_add_m:"ダッシュボードで、拡張機能を動かすチャンネルを追加してください。",ch_connect_t:"チャンネルを接続",ch_connect_m:"YouTube チャンネルの URL を貼り付けてください。",ch_save:"チャンネルを保存",lk_hidden:"Pro コンテンツは非表示",lk_all:"Pro にするとすべて解放されます。",lk_more:"Pro でさらに {n} 件",lk_preview:"無料プレビュー"},
 ko:{fl_title:"일일 한도에 도달했습니다",fl_msg:"무료 플랜은 하루 {n}회 분석할 수 있습니다. Pro로 바꾸면 무제한입니다.",ch_denied_t:"허용되지 않은 채널",ch_denied_m:"이 YouTube 채널은 VidSpark AI 계정에 연결되어 있지 않습니다.",ch_manage:"내 채널 관리",ch_recode:"다른 코드 입력",ch_add_t:"채널 추가",ch_add_m:"대시보드에서 확장이 작동할 채널을 추가하세요.",ch_connect_t:"채널 연결",ch_connect_m:"YouTube 채널 URL을 붙여넣으세요.",ch_save:"내 채널 저장",lk_hidden:"Pro 콘텐츠 숨김",lk_all:"Pro로 전환하면 모두 열립니다.",lk_more:"Pro로 {n}개 더",lk_preview:"무료 미리보기"},
 hi:{fl_title:"दैनिक सीमा पूरी हो गई",fl_msg:"मुफ़्त प्लान में रोज़ {n} विश्लेषण मिलते हैं। असीमित के लिए Pro लें।",ch_denied_t:"चैनल अनुमत नहीं",ch_denied_m:"यह YouTube चैनल आपके VidSpark AI खाते से जुड़ा नहीं है।",ch_manage:"मेरे चैनल प्रबंधित करें",ch_recode:"दूसरा कोड डालें",ch_add_t:"अपना चैनल जोड़ें",ch_add_m:"अपने डैशबोर्ड पर जाकर वे चैनल जोड़ें जहाँ एक्सटेंशन काम करना चाहिए।",ch_connect_t:"अपना चैनल जोड़ें",ch_connect_m:"अपने YouTube चैनल का URL चिपकाएँ।",ch_save:"मेरा चैनल सहेजें",lk_hidden:"Pro सामग्री छिपी है",lk_all:"सब खोलने के लिए Pro लें।",lk_more:"Pro के साथ {n} और",lk_preview:"मुफ़्त झलक"},
 zh:{fl_title:"已达每日上限",fl_msg:"免费套餐每天可分析 {n} 次。升级 Pro 可无限次分析。",ch_denied_t:"该频道未获授权",ch_denied_m:"此 YouTube 频道未连接到你的 VidSpark AI 账号。",ch_manage:"管理我的频道",ch_recode:"输入其他激活码",ch_add_t:"添加你的频道",ch_add_m:"前往控制台，添加需要启用扩展的频道。",ch_connect_t:"连接你的频道",ch_connect_m:"粘贴你的 YouTube 频道链接。",ch_save:"保存我的频道",lk_hidden:"Pro 内容已隐藏",lk_all:"升级 Pro 解锁全部。",lk_more:"升级 Pro 再多 {n} 条",lk_preview:"免费预览"},
 tr:{fl_title:"Günlük sınıra ulaşıldı",fl_msg:"Ücretsiz plan günde {n} analiz sağlar. Sınırsız için Pro'ya geç.",ch_denied_t:"Kanal yetkili değil",ch_denied_m:"Bu YouTube kanalı VidSpark AI hesabına bağlı değil.",ch_manage:"Kanallarımı yönet",ch_recode:"Başka bir kod gir",ch_add_t:"Kanalını ekle",ch_add_m:"Uzantının çalışacağı kanalları eklemek için panoya git.",ch_connect_t:"Kanalını bağla",ch_connect_m:"YouTube kanalının bağlantısını yapıştır.",ch_save:"Kanalımı kaydet",lk_hidden:"Pro içeriği gizli",lk_all:"Her şeyi açmak için Pro'ya geç.",lk_more:"Pro ile {n} tane daha",lk_preview:"Ücretsiz önizleme"},
 nl:{fl_title:"Daglimiet bereikt",fl_msg:"Het gratis plan geeft {n} analyses per dag. Met Pro zijn ze onbeperkt.",ch_denied_t:"Kanaal niet toegestaan",ch_denied_m:"Dit YouTube-kanaal is niet verbonden met je VidSpark AI-account.",ch_manage:"Mijn kanalen beheren",ch_recode:"Andere code invoeren",ch_add_t:"Voeg je kanaal toe",ch_add_m:"Ga naar je dashboard om de kanalen toe te voegen waar de extensie moet werken.",ch_connect_t:"Je kanaal verbinden",ch_connect_m:"Plak de URL van je YouTube-kanaal.",ch_save:"Mijn kanaal opslaan",lk_hidden:"Pro-inhoud verborgen",lk_all:"Ga Pro om alles te ontgrendelen.",lk_more:"{n} meer met Pro",lk_preview:"Gratis voorbeeld"}
};
Object.keys(UI_I18N).forEach(l=>{ if(I18N[l]){ for(const k in UI_I18N[l]){ if(!(k in I18N[l])) I18N[l][k]=UI_I18N[l][k]; } } });

/* ══════════════════════════════════════════════════════════════
   COMPLÉMENT DE TRADUCTION — FIX_I18N et le bloc TikTok n'existaient qu'en
   fr / en / ar : 89 clés s'affichaient en clair (français) ou en clé brute dans
   les 11 autres langues. Découpé en quatre blocs par famille de langues pour
   rester relisible ; même politique de fusion que partout (ne remplace jamais
   une clé déjà définie).
══════════════════════════════════════════════════════════════ */
function mergeI18N(block){
  Object.keys(block).forEach(l=>{ if(I18N[l]){ for(const k in block[l]){ if(!(k in I18N[l])) I18N[l][k]=block[l][k]; } } });
}

mergeI18N({
 es:{analysis_done:"Análisis generado.",download:"Descargar",err_channel:"Canal no encontrado",ex_desc:"Añadir: resumen (150 car.) + marcas de tiempo + palabras clave + CTA + enlaces",ex_em:"Increíble",ex_guide:"Guía completa",ex_hook:"Cómo",export:"Exportar",gate_feat1:"Corrección prioritaria para +15 pts",gate_feat2:"Optimización SEO detallada",gate_feat3:"Consejo de miniatura y gancho viral",gate_unlock:"🔓 Desbloquea todo: correcciones, datos reales de YouTube, IA…",impact_desc_no:"Una descripción corta perjudica el SEO",impact_desc_ok:"Descripción bien optimizada",impact_em_no:"Las palabras potentes aumentan el CTR un 20%",impact_em_ok:"Buen potencial emocional",impact_hook_no:"Un gancho al inicio del título aumenta los clics un 25%",impact_hook_ok:"Gancho de CTR eficaz detectado",kw_add_hint:"Añadir estas palabras clave al título o a la descripción puede mejorar la visibilidad en búsquedas similares.",no_result:"Sin resultados",no_sugg:"Sin sugerencias",no_sugg_more:"No hay más sugerencias",no_tag:"Este vídeo no tiene etiquetas públicas.",pts_seo:"puntos SEO",pts_viral:"puntos Viral",reactivate_confirm:"¿Liberar este código de este dispositivo y cambiarlo? El código podrá reutilizarse en otro PC.",regenerate:"Regenerar",share:"Compartir",spin_abtest:"⚔️ Análisis IA en curso…",spin_audience:"🌍 Analizando la audiencia…",spin_audit:"📊 Auditando…",spin_community:"📣 Generando publicaciones…",spin_desc:"📝 Generando la descripción…",spin_ideas:"💡 Generando ideas…",spin_kw:"🔍 Analizando la oportunidad…",spin_planner:"📅 Creando el calendario…",spin_playlists:"🎞️ Analizando las listas…",spin_realstats:"📡 Cargando datos reales…",spin_shorts:"🎬 Generando Shorts…",spin_shorts_real:"🎬 Generando (fragmentos reales)…",spin_sponsor:"💼 Generando el kit de patrocinio…",spin_thumbab:"📸 Análisis Vision en curso…",stat_avg_views:"Vistas med/vídeo",stat_comments:"Comentarios",stat_engagement:"Interacción",stat_freq:"Frecuencia",stat_likes:"Me gusta",stat_subs:"Suscriptores",stat_tagged:"Vídeos etiquetados",stat_tags_real:"Etiquetas reales",stat_total_vids:"Vídeos en total",stat_views:"Vistas",stat_vph:"Vistas/hora",tk_caption:"Descripción optimizada",tk_clips:"clips",tk_copy:"Copiar",tk_days:"días",tk_desc_ph:"Contexto / descripción (opcional)…",tk_hooks:"Ganchos",tk_ideas:"ideas",tk_intro:"Indica tu tema: la IA genera descripción, ganchos, hashtags, palabras clave y guion optimizados para TikTok.",tk_keywords:"Palabras clave de búsqueda",tk_need_topic:"Escribe un tema de vídeo.",tk_ready:"Contenido listo para publicar",tk_run:"Generar el SEO de TikTok",tk_script:"Estructura / guion",tk_sound:"Consejo de sonido / música",tk_spin:"La IA está optimizando tu vídeo de TikTok…",tk_tips:"Consejos y descubribilidad",tk_topic_ph:"Tema de tu vídeo de TikTok…",tkc_freq_ph:"Ritmo (p. ej.: 1 vídeo/día)…",tkc_ready:"Calendario listo",tkc_run:"Generar el calendario de 7 días",tkc_spin:"Creando el calendario…",tkc_title:"Calendario de contenido",tkh_ready:"Ganchos listos",tkh_run:"Generar 8 ganchos",tkh_spin:"Generando ganchos…",tkh_title:"Optimizador de ganchos",tki_ready:"Ideas listas",tki_run:"Generar 10 ideas",tki_spin:"Buscando ideas virales…",tki_title:"Ideas virales de TikTok",tkr_intro:"Abre un vídeo de YouTube: la IA localiza los mejores momentos y da los códigos de tiempo para cortar en TikTok.",tkr_novideo:"Abre primero un vídeo de YouTube para reutilizarlo.",tkr_ready:"Clips listos para cortar",tkr_run:"Convertir a TikTok",tkr_spin:"Cortando en clips de TikTok…",tkr_title:"YouTube → TikTok"},
 pt:{analysis_done:"Análise gerada.",download:"Descarregar",err_channel:"Canal não encontrado",ex_desc:"Adicionar: resumo (150 car.) + marcas de tempo + palavras-chave + CTA + ligações",ex_em:"Incrível",ex_guide:"Guia completo",ex_hook:"Como",export:"Exportar",gate_feat1:"Correção prioritária para +15 pts",gate_feat2:"Otimização SEO detalhada",gate_feat3:"Conselhos de miniatura e gancho viral",gate_unlock:"🔓 Desbloqueie tudo: correções, dados reais do YouTube, IA…",impact_desc_no:"Uma descrição curta prejudica o SEO",impact_desc_ok:"Descrição bem otimizada",impact_em_no:"Palavras fortes aumentam o CTR em 20%",impact_em_ok:"Bom potencial emocional",impact_hook_no:"Um gancho no início do título aumenta os cliques em 25%",impact_hook_ok:"Gancho de CTR eficaz detetado",kw_add_hint:"Adicionar estas palavras-chave ao título ou à descrição pode melhorar a visibilidade em pesquisas semelhantes.",no_result:"Sem resultados",no_sugg:"Sem sugestões",no_sugg_more:"Sem mais sugestões",no_tag:"Este vídeo não tem tags públicas.",pts_seo:"pontos SEO",pts_viral:"pontos Viral",reactivate_confirm:"Libertar este código deste dispositivo e mudar de código? O código poderá ser reutilizado noutro PC.",regenerate:"Regenerar",share:"Partilhar",spin_abtest:"⚔️ Análise IA em curso…",spin_audience:"🌍 A analisar a audiência…",spin_audit:"📊 A auditar…",spin_community:"📣 A gerar publicações…",spin_desc:"📝 A gerar a descrição…",spin_ideas:"💡 A gerar ideias…",spin_kw:"🔍 A analisar a oportunidade…",spin_planner:"📅 A criar o planeamento…",spin_playlists:"🎞️ A analisar as playlists…",spin_realstats:"📡 A carregar dados reais…",spin_shorts:"🎬 A gerar Shorts…",spin_shorts_real:"🎬 A gerar (trechos reais)…",spin_sponsor:"💼 A gerar o kit de patrocínio…",spin_thumbab:"📸 Análise Vision em curso…",stat_avg_views:"Visual. méd/vídeo",stat_comments:"Comentários",stat_engagement:"Envolvimento",stat_freq:"Frequência",stat_likes:"Gostos",stat_subs:"Subscritores",stat_tagged:"Vídeos com tags",stat_tags_real:"Tags reais",stat_total_vids:"Total de vídeos",stat_views:"Visualizações",stat_vph:"Visual./hora",tk_caption:"Legenda otimizada",tk_clips:"clipes",tk_copy:"Copiar",tk_days:"dias",tk_desc_ph:"Contexto / descrição (opcional)…",tk_hooks:"Ganchos",tk_ideas:"ideias",tk_intro:"Indique o seu tema: a IA gera legenda, ganchos, hashtags, palavras-chave e guião otimizados para o TikTok.",tk_keywords:"Palavras-chave de pesquisa",tk_need_topic:"Escreva um tema de vídeo.",tk_ready:"Conteúdo pronto a publicar",tk_run:"Gerar o SEO do TikTok",tk_script:"Estrutura / guião",tk_sound:"Conselho de som / música",tk_spin:"A IA está a otimizar o seu vídeo do TikTok…",tk_tips:"Dicas e descoberta",tk_topic_ph:"Tema do seu vídeo do TikTok…",tkc_freq_ph:"Ritmo (ex.: 1 vídeo/dia)…",tkc_ready:"Calendário pronto",tkc_run:"Gerar o calendário de 7 dias",tkc_spin:"A criar o calendário…",tkc_title:"Calendário de conteúdo",tkh_ready:"Ganchos prontos",tkh_run:"Gerar 8 ganchos",tkh_spin:"A gerar ganchos…",tkh_title:"Otimizador de ganchos",tki_ready:"Ideias prontas",tki_run:"Gerar 10 ideias",tki_spin:"A procurar ideias virais…",tki_title:"Ideias virais do TikTok",tkr_intro:"Abra um vídeo do YouTube: a IA encontra os melhores momentos e dá os códigos de tempo para cortar para o TikTok.",tkr_novideo:"Abra primeiro um vídeo do YouTube para o reaproveitar.",tkr_ready:"Clipes prontos a cortar",tkr_run:"Converter para TikTok",tkr_spin:"A cortar em clipes do TikTok…",tkr_title:"YouTube → TikTok"},
 it:{analysis_done:"Analisi generata.",download:"Scarica",err_channel:"Canale non trovato",ex_desc:"Aggiungere: riassunto (150 car.) + timestamp + parole chiave + CTA + link",ex_em:"Incredibile",ex_guide:"Guida completa",ex_hook:"Come",export:"Esporta",gate_feat1:"Correzione prioritaria per +15 pt",gate_feat2:"Ottimizzazione SEO dettagliata",gate_feat3:"Consigli su miniatura e gancio virale",gate_unlock:"🔓 Sblocca tutto: correzioni, dati reali di YouTube, IA…",impact_desc_no:"Una descrizione breve penalizza la SEO",impact_desc_ok:"Descrizione ben ottimizzata",impact_em_no:"Le parole forti aumentano il CTR del 20%",impact_em_ok:"Buon potenziale emotivo",impact_hook_no:"Un gancio all'inizio del titolo aumenta i clic del 25%",impact_hook_ok:"Gancio CTR efficace rilevato",kw_add_hint:"Aggiungere queste parole chiave nel titolo o nella descrizione può migliorare la visibilità nelle ricerche simili.",no_result:"Nessun risultato",no_sugg:"Nessun suggerimento",no_sugg_more:"Nessun altro suggerimento",no_tag:"Nessun tag pubblico su questo video.",pts_seo:"punti SEO",pts_viral:"punti Viral",reactivate_confirm:"Liberare questo codice da questo dispositivo e cambiarlo? Il codice potrà essere riusato su un altro PC.",regenerate:"Rigenera",share:"Condividi",spin_abtest:"⚔️ Analisi IA in corso…",spin_audience:"🌍 Analisi del pubblico…",spin_audit:"📊 Audit in corso…",spin_community:"📣 Generazione dei post…",spin_desc:"📝 Generazione della descrizione…",spin_ideas:"💡 Generazione delle idee…",spin_kw:"🔍 Analisi dell'opportunità…",spin_planner:"📅 Creazione del calendario…",spin_playlists:"🎞️ Analisi delle playlist…",spin_realstats:"📡 Caricamento dei dati reali…",spin_shorts:"🎬 Generazione degli Shorts…",spin_shorts_real:"🎬 Generazione (spezzoni reali)…",spin_sponsor:"💼 Generazione del kit sponsor…",spin_thumbab:"📸 Analisi Vision in corso…",stat_avg_views:"Visual. medie/video",stat_comments:"Commenti",stat_engagement:"Coinvolgimento",stat_freq:"Frequenza",stat_likes:"Mi piace",stat_subs:"Iscritti",stat_tagged:"Video con tag",stat_tags_real:"Tag reali",stat_total_vids:"Video totali",stat_views:"Visualizzazioni",stat_vph:"Visual./ora",tk_caption:"Didascalia ottimizzata",tk_clips:"clip",tk_copy:"Copia",tk_days:"giorni",tk_desc_ph:"Contesto / descrizione (facoltativo)…",tk_hooks:"Ganci",tk_ideas:"idee",tk_intro:"Indica il tuo argomento: l'IA genera didascalia, ganci, hashtag, parole chiave e script ottimizzati per TikTok.",tk_keywords:"Parole chiave di ricerca",tk_need_topic:"Inserisci un argomento video.",tk_ready:"Contenuto pronto da pubblicare",tk_run:"Genera la SEO TikTok",tk_script:"Struttura / script",tk_sound:"Consiglio audio / musica",tk_spin:"L'IA sta ottimizzando il tuo video TikTok…",tk_tips:"Consigli e scopribilità",tk_topic_ph:"Argomento del tuo video TikTok…",tkc_freq_ph:"Ritmo (es.: 1 video/giorno)…",tkc_ready:"Calendario pronto",tkc_run:"Genera il calendario di 7 giorni",tkc_spin:"Creazione del calendario…",tkc_title:"Calendario dei contenuti",tkh_ready:"Ganci pronti",tkh_run:"Genera 8 ganci",tkh_spin:"Generazione dei ganci…",tkh_title:"Ottimizzatore di ganci",tki_ready:"Idee pronte",tki_run:"Genera 10 idee",tki_spin:"Ricerca di idee virali…",tki_title:"Idee virali TikTok",tkr_intro:"Apri un video YouTube: l'IA individua i momenti migliori e fornisce i timecode da tagliare per TikTok.",tkr_novideo:"Apri prima un video YouTube per riadattarlo.",tkr_ready:"Clip pronte da tagliare",tkr_run:"Converti in TikTok",tkr_spin:"Taglio in clip TikTok…",tkr_title:"YouTube → TikTok"}
});

mergeI18N({
 de:{analysis_done:"Analyse erstellt.",download:"Herunterladen",err_channel:"Kanal nicht gefunden",ex_desc:"Ergänzen: Zusammenfassung (150 Zeichen) + Zeitmarken + Keywords + CTA + Links",ex_em:"Unglaublich",ex_guide:"Komplettanleitung",ex_hook:"Wie",export:"Exportieren",gate_feat1:"Vorrangige Korrektur für +15 Punkte",gate_feat2:"Detaillierte SEO-Optimierung",gate_feat3:"Thumbnail- und Viral-Hook-Tipps",gate_unlock:"🔓 Alles freischalten: Korrekturen, echte YouTube-Daten, KI…",impact_desc_no:"Eine kurze Beschreibung schadet der SEO",impact_desc_ok:"Gut optimierte Beschreibung",impact_em_no:"Starke Wörter erhöhen die CTR um 20%",impact_em_ok:"Gutes emotionales Potenzial",impact_hook_no:"Ein Hook am Titelanfang erhöht die Klicks um 25%",impact_hook_ok:"Wirksamer CTR-Hook erkannt",kw_add_hint:"Diese Keywords im Titel oder in der Beschreibung können die Sichtbarkeit bei ähnlichen Suchen verbessern.",no_result:"Kein Ergebnis",no_sugg:"Kein Vorschlag",no_sugg_more:"Keine weiteren Vorschläge",no_tag:"Keine öffentlichen Tags bei diesem Video.",pts_seo:"SEO-Punkte",pts_viral:"Viral-Punkte",reactivate_confirm:"Diesen Code von diesem Gerät lösen und wechseln? Der Code kann auf einem anderen PC wiederverwendet werden.",regenerate:"Neu generieren",share:"Teilen",spin_abtest:"⚔️ KI-Analyse läuft…",spin_audience:"🌍 Publikum wird analysiert…",spin_audit:"📊 Audit läuft…",spin_community:"📣 Beiträge werden erstellt…",spin_desc:"📝 Beschreibung wird erstellt…",spin_ideas:"💡 Ideen werden erstellt…",spin_kw:"🔍 Chance wird analysiert…",spin_planner:"📅 Plan wird erstellt…",spin_playlists:"🎞️ Playlists werden analysiert…",spin_realstats:"📡 Echte Daten werden geladen…",spin_shorts:"🎬 Shorts werden erstellt…",spin_shorts_real:"🎬 Erstellung (echte Ausschnitte)…",spin_sponsor:"💼 Sponsor-Kit wird erstellt…",spin_thumbab:"📸 Vision-Analyse läuft…",stat_avg_views:"Ø Aufrufe/Video",stat_comments:"Kommentare",stat_engagement:"Interaktion",stat_freq:"Häufigkeit",stat_likes:"Likes",stat_subs:"Abonnenten",stat_tagged:"Videos mit Tags",stat_tags_real:"Echte Tags",stat_total_vids:"Videos insgesamt",stat_views:"Aufrufe",stat_vph:"Aufrufe/Stunde",tk_caption:"Optimierte Bildbeschreibung",tk_clips:"Clips",tk_copy:"Kopieren",tk_days:"Tage",tk_desc_ph:"Kontext / Beschreibung (optional)…",tk_hooks:"Hooks",tk_ideas:"Ideen",tk_intro:"Gib dein Thema an: Die KI erstellt Caption, Hooks, Hashtags, Keywords und Skript, optimiert für TikTok.",tk_keywords:"Such-Keywords",tk_need_topic:"Gib ein Videothema ein.",tk_ready:"Inhalt bereit zum Posten",tk_run:"TikTok-SEO erstellen",tk_script:"Struktur / Skript",tk_sound:"Ton- / Musiktipp",tk_spin:"Die KI optimiert dein TikTok-Video…",tk_tips:"Tipps & Auffindbarkeit",tk_topic_ph:"Thema deines TikTok-Videos…",tkc_freq_ph:"Rhythmus (z. B. 1 Video/Tag)…",tkc_ready:"Kalender fertig",tkc_run:"7-Tage-Kalender erstellen",tkc_spin:"Kalender wird erstellt…",tkc_title:"Content-Kalender",tkh_ready:"Hooks fertig",tkh_run:"8 Hooks erstellen",tkh_spin:"Hooks werden erstellt…",tkh_title:"Hook-Optimierer",tki_ready:"Ideen fertig",tki_run:"10 Ideen erstellen",tki_spin:"Virale Ideen werden gesucht…",tki_title:"Virale TikTok-Ideen",tkr_intro:"Öffne ein YouTube-Video: Die KI findet die besten Momente und gibt die Timecodes zum Schneiden für TikTok.",tkr_novideo:"Öffne zuerst ein YouTube-Video, um es umzuwandeln.",tkr_ready:"Clips bereit zum Schneiden",tkr_run:"In TikTok umwandeln",tkr_spin:"Schneiden in TikTok-Clips…",tkr_title:"YouTube → TikTok"},
 nl:{analysis_done:"Analyse gegenereerd.",download:"Downloaden",err_channel:"Kanaal niet gevonden",ex_desc:"Toevoegen: samenvatting (150 tekens) + tijdcodes + zoekwoorden + CTA + links",ex_em:"Ongelooflijk",ex_guide:"Complete gids",ex_hook:"Hoe",export:"Exporteren",gate_feat1:"Prioritaire correctie voor +15 pt",gate_feat2:"Gedetailleerde SEO-optimalisatie",gate_feat3:"Thumbnail- en viral-hook-advies",gate_unlock:"🔓 Ontgrendel alles: correcties, echte YouTube-data, AI…",impact_desc_no:"Een korte beschrijving schaadt de SEO",impact_desc_ok:"Goed geoptimaliseerde beschrijving",impact_em_no:"Krachtige woorden verhogen de CTR met 20%",impact_em_ok:"Goed emotioneel potentieel",impact_hook_no:"Een hook aan het begin van de titel verhoogt de clicks met 25%",impact_hook_ok:"Effectieve CTR-hook gevonden",kw_add_hint:"Deze zoekwoorden in de titel of beschrijving kunnen de zichtbaarheid bij vergelijkbare zoekopdrachten verbeteren.",no_result:"Geen resultaat",no_sugg:"Geen suggestie",no_sugg_more:"Geen verdere suggesties",no_tag:"Geen openbare tags op deze video.",pts_seo:"SEO-punten",pts_viral:"Viral-punten",reactivate_confirm:"Deze code van dit apparaat vrijgeven en wisselen? De code kan op een andere pc opnieuw worden gebruikt.",regenerate:"Opnieuw genereren",share:"Delen",spin_abtest:"⚔️ AI-analyse bezig…",spin_audience:"🌍 Publiek wordt geanalyseerd…",spin_audit:"📊 Audit bezig…",spin_community:"📣 Berichten worden gemaakt…",spin_desc:"📝 Beschrijving wordt gemaakt…",spin_ideas:"💡 Ideeën worden gemaakt…",spin_kw:"🔍 Kans wordt geanalyseerd…",spin_planner:"📅 Planning wordt gemaakt…",spin_playlists:"🎞️ Playlists worden geanalyseerd…",spin_realstats:"📡 Echte gegevens worden geladen…",spin_shorts:"🎬 Shorts worden gemaakt…",spin_shorts_real:"🎬 Genereren (echte fragmenten)…",spin_sponsor:"💼 Sponsorkit wordt gemaakt…",spin_thumbab:"📸 Vision-analyse bezig…",stat_avg_views:"Gem. weergaven/video",stat_comments:"Reacties",stat_engagement:"Betrokkenheid",stat_freq:"Frequentie",stat_likes:"Likes",stat_subs:"Abonnees",stat_tagged:"Video's met tags",stat_tags_real:"Echte tags",stat_total_vids:"Video's totaal",stat_views:"Weergaven",stat_vph:"Weergaven/uur",tk_caption:"Geoptimaliseerde caption",tk_clips:"clips",tk_copy:"Kopiëren",tk_days:"dagen",tk_desc_ph:"Context / beschrijving (optioneel)…",tk_hooks:"Hooks",tk_ideas:"ideeën",tk_intro:"Geef je onderwerp: de AI maakt caption, hooks, hashtags, zoekwoorden en script, geoptimaliseerd voor TikTok.",tk_keywords:"Zoekwoorden",tk_need_topic:"Vul een videoonderwerp in.",tk_ready:"Content klaar om te posten",tk_run:"TikTok-SEO genereren",tk_script:"Structuur / script",tk_sound:"Geluid- / muziektip",tk_spin:"De AI optimaliseert je TikTok-video…",tk_tips:"Tips & vindbaarheid",tk_topic_ph:"Onderwerp van je TikTok-video…",tkc_freq_ph:"Ritme (bv. 1 video/dag)…",tkc_ready:"Kalender klaar",tkc_run:"Kalender van 7 dagen genereren",tkc_spin:"Kalender wordt gemaakt…",tkc_title:"Contentkalender",tkh_ready:"Hooks klaar",tkh_run:"8 hooks genereren",tkh_spin:"Hooks worden gemaakt…",tkh_title:"Hook-optimalisator",tki_ready:"Ideeën klaar",tki_run:"10 ideeën genereren",tki_spin:"Virale ideeën worden gezocht…",tki_title:"Virale TikTok-ideeën",tkr_intro:"Open een YouTube-video: de AI vindt de beste momenten en geeft de tijdcodes om voor TikTok te knippen.",tkr_novideo:"Open eerst een YouTube-video om hem te hergebruiken.",tkr_ready:"Clips klaar om te knippen",tkr_run:"Omzetten naar TikTok",tkr_spin:"Knippen in TikTok-clips…",tkr_title:"YouTube → TikTok"},
 tr:{analysis_done:"Analiz oluşturuldu.",download:"İndir",err_channel:"Kanal bulunamadı",ex_desc:"Ekle: özet (150 karakter) + zaman damgaları + anahtar kelimeler + CTA + bağlantılar",ex_em:"İnanılmaz",ex_guide:"Tam rehber",ex_hook:"Nasıl",export:"Dışa aktar",gate_feat1:"+15 puan için öncelikli düzeltme",gate_feat2:"Ayrıntılı SEO optimizasyonu",gate_feat3:"Küçük resim ve viral kanca önerileri",gate_unlock:"🔓 Her şeyi aç: düzeltmeler, gerçek YouTube verileri, yapay zekâ…",impact_desc_no:"Kısa açıklama SEO'ya zarar verir",impact_desc_ok:"İyi optimize edilmiş açıklama",impact_em_no:"Güçlü kelimeler TO'yu %20 artırır",impact_em_ok:"İyi duygusal potansiyel",impact_hook_no:"Başlık başındaki kanca tıklamaları %25 artırır",impact_hook_ok:"Etkili TO kancası tespit edildi",kw_add_hint:"Bu anahtar kelimeleri başlığa veya açıklamaya eklemek benzer aramalarda görünürlüğü artırabilir.",no_result:"Sonuç yok",no_sugg:"Öneri yok",no_sugg_more:"Başka öneri yok",no_tag:"Bu videoda herkese açık etiket yok.",pts_seo:"SEO puanı",pts_viral:"Viral puanı",reactivate_confirm:"Bu kodu bu cihazdan serbest bırakıp değiştirmek istiyor musun? Kod başka bir bilgisayarda yeniden kullanılabilir.",regenerate:"Yeniden oluştur",share:"Paylaş",spin_abtest:"⚔️ Yapay zekâ analizi sürüyor…",spin_audience:"🌍 Kitle analiz ediliyor…",spin_audit:"📊 Denetim sürüyor…",spin_community:"📣 Gönderiler oluşturuluyor…",spin_desc:"📝 Açıklama oluşturuluyor…",spin_ideas:"💡 Fikirler oluşturuluyor…",spin_kw:"🔍 Fırsat analiz ediliyor…",spin_planner:"📅 Takvim oluşturuluyor…",spin_playlists:"🎞️ Oynatma listeleri analiz ediliyor…",spin_realstats:"📡 Gerçek veriler yükleniyor…",spin_shorts:"🎬 Shorts oluşturuluyor…",spin_shorts_real:"🎬 Oluşturuluyor (gerçek kesitler)…",spin_sponsor:"💼 Sponsor kiti oluşturuluyor…",spin_thumbab:"📸 Vision analizi sürüyor…",stat_avg_views:"Ort. görüntüleme/video",stat_comments:"Yorumlar",stat_engagement:"Etkileşim",stat_freq:"Sıklık",stat_likes:"Beğeniler",stat_subs:"Aboneler",stat_tagged:"Etiketli videolar",stat_tags_real:"Gerçek etiketler",stat_total_vids:"Toplam video",stat_views:"Görüntüleme",stat_vph:"Görüntüleme/saat",tk_caption:"Optimize edilmiş açıklama",tk_clips:"klip",tk_copy:"Kopyala",tk_days:"gün",tk_desc_ph:"Bağlam / açıklama (isteğe bağlı)…",tk_hooks:"Kancalar",tk_ideas:"fikir",tk_intro:"Konunu yaz: yapay zekâ TikTok için açıklama, kancalar, hashtag, anahtar kelime ve senaryo üretir.",tk_keywords:"Arama anahtar kelimeleri",tk_need_topic:"Bir video konusu gir.",tk_ready:"İçerik yayına hazır",tk_run:"TikTok SEO'sunu oluştur",tk_script:"Yapı / senaryo",tk_sound:"Ses / müzik önerisi",tk_spin:"Yapay zekâ TikTok videonu optimize ediyor…",tk_tips:"İpuçları ve keşfedilebilirlik",tk_topic_ph:"TikTok videonun konusu…",tkc_freq_ph:"Tempo (ör. günde 1 video)…",tkc_ready:"Takvim hazır",tkc_run:"7 günlük takvim oluştur",tkc_spin:"Takvim oluşturuluyor…",tkc_title:"İçerik takvimi",tkh_ready:"Kancalar hazır",tkh_run:"8 kanca oluştur",tkh_spin:"Kancalar oluşturuluyor…",tkh_title:"Kanca iyileştirici",tki_ready:"Fikirler hazır",tki_run:"10 fikir oluştur",tki_spin:"Viral fikirler aranıyor…",tki_title:"Viral TikTok fikirleri",tkr_intro:"Bir YouTube videosu aç: yapay zekâ en iyi anları bulur ve TikTok için kesilecek zaman kodlarını verir.",tkr_novideo:"Önce yeniden kullanmak için bir YouTube videosu aç.",tkr_ready:"Kesilmeye hazır klipler",tkr_run:"TikTok'a dönüştür",tkr_spin:"TikTok kliplerine bölünüyor…",tkr_title:"YouTube → TikTok"}
});

mergeI18N({
 ru:{analysis_done:"Анализ готов.",download:"Скачать",err_channel:"Канал не найден",ex_desc:"Добавить: краткое описание (150 симв.) + таймкоды + ключевые слова + призыв + ссылки",ex_em:"Невероятно",ex_guide:"Полное руководство",ex_hook:"Как",export:"Экспорт",gate_feat1:"Приоритетное исправление на +15 очков",gate_feat2:"Подробная SEO-оптимизация",gate_feat3:"Советы по обложке и вирусному хуку",gate_unlock:"🔓 Открой всё: исправления, реальные данные YouTube, ИИ…",impact_desc_no:"Короткое описание вредит SEO",impact_desc_ok:"Описание хорошо оптимизировано",impact_em_no:"Сильные слова повышают CTR на 20%",impact_em_ok:"Хороший эмоциональный потенциал",impact_hook_no:"Хук в начале заголовка повышает клики на 25%",impact_hook_ok:"Найден работающий CTR-хук",kw_add_hint:"Добавление этих ключевых слов в заголовок или описание может улучшить видимость в похожих запросах.",no_result:"Нет результатов",no_sugg:"Нет предложений",no_sugg_more:"Больше предложений нет",no_tag:"У этого видео нет публичных тегов.",pts_seo:"очков SEO",pts_viral:"очков виральности",reactivate_confirm:"Освободить этот код от этого устройства и сменить его? Код можно будет использовать на другом ПК.",regenerate:"Сгенерировать заново",share:"Поделиться",spin_abtest:"⚔️ Идёт анализ ИИ…",spin_audience:"🌍 Анализ аудитории…",spin_audit:"📊 Идёт аудит…",spin_community:"📣 Создание постов…",spin_desc:"📝 Создание описания…",spin_ideas:"💡 Создание идей…",spin_kw:"🔍 Анализ возможности…",spin_planner:"📅 Составление плана…",spin_playlists:"🎞️ Анализ плейлистов…",spin_realstats:"📡 Загрузка реальных данных…",spin_shorts:"🎬 Создание Shorts…",spin_shorts_real:"🎬 Создание (реальные фрагменты)…",spin_sponsor:"💼 Создание спонсорского кита…",spin_thumbab:"📸 Идёт анализ Vision…",stat_avg_views:"Ср. просмотры/видео",stat_comments:"Комментарии",stat_engagement:"Вовлечённость",stat_freq:"Частота",stat_likes:"Лайки",stat_subs:"Подписчики",stat_tagged:"Видео с тегами",stat_tags_real:"Реальные теги",stat_total_vids:"Всего видео",stat_views:"Просмотры",stat_vph:"Просмотры/час",tk_caption:"Оптимизированное описание",tk_clips:"клипов",tk_copy:"Копировать",tk_days:"дней",tk_desc_ph:"Контекст / описание (необязательно)…",tk_hooks:"Хуки",tk_ideas:"идей",tk_intro:"Укажи тему: ИИ создаст описание, хуки, хэштеги, ключевые слова и сценарий под TikTok.",tk_keywords:"Поисковые ключевые слова",tk_need_topic:"Введи тему видео.",tk_ready:"Контент готов к публикации",tk_run:"Создать SEO для TikTok",tk_script:"Структура / сценарий",tk_sound:"Совет по звуку / музыке",tk_spin:"ИИ оптимизирует твоё видео для TikTok…",tk_tips:"Советы и находимость",tk_topic_ph:"Тема твоего видео в TikTok…",tkc_freq_ph:"Ритм (напр.: 1 видео в день)…",tkc_ready:"Календарь готов",tkc_run:"Создать календарь на 7 дней",tkc_spin:"Составление календаря…",tkc_title:"Контент-календарь",tkh_ready:"Хуки готовы",tkh_run:"Создать 8 хуков",tkh_spin:"Создание хуков…",tkh_title:"Оптимизатор хуков",tki_ready:"Идеи готовы",tki_run:"Создать 10 идей",tki_spin:"Поиск вирусных идей…",tki_title:"Вирусные идеи для TikTok",tkr_intro:"Открой видео на YouTube: ИИ найдёт лучшие моменты и даст таймкоды для нарезки под TikTok.",tkr_novideo:"Сначала открой видео на YouTube, чтобы его переработать.",tkr_ready:"Клипы готовы к нарезке",tkr_run:"Превратить в TikTok",tkr_spin:"Нарезка на клипы TikTok…",tkr_title:"YouTube → TikTok"},
 /* L'arabe n'avait que ces quatre libellés d'action manquants. */
 ar:{download:"تنزيل",export:"تصدير",regenerate:"إعادة التوليد",share:"مشاركة"}
});

mergeI18N({
 ja:{analysis_done:"分析を生成しました。",download:"ダウンロード",err_channel:"チャンネルが見つかりません",ex_desc:"追加：要約（150文字）＋タイムスタンプ＋キーワード＋CTA＋リンク",ex_em:"驚きの",ex_guide:"完全ガイド",ex_hook:"方法",export:"書き出す",gate_feat1:"+15 ポイントの優先修正",gate_feat2:"詳細な SEO 最適化",gate_feat3:"サムネイルとバズる導入のアドバイス",gate_unlock:"🔓 すべて解放：修正、YouTube の実データ、AI…",impact_desc_no:"説明文が短いと SEO に不利です",impact_desc_ok:"説明文は十分に最適化されています",impact_em_no:"強い言葉は CTR を 20% 高めます",impact_em_ok:"感情に訴える力が十分あります",impact_hook_no:"タイトル冒頭のフックはクリックを 25% 高めます",impact_hook_ok:"効果的な CTR フックを検出しました",kw_add_hint:"これらのキーワードをタイトルや説明文に入れると、類似検索での露出が改善する可能性があります。",no_result:"結果なし",no_sugg:"提案なし",no_sugg_more:"これ以上の提案はありません",no_tag:"この動画に公開タグはありません。",pts_seo:"SEO ポイント",pts_viral:"バズ ポイント",reactivate_confirm:"このコードをこの端末から解放して変更しますか？コードは別の PC で再利用できます。",regenerate:"再生成",share:"共有",spin_abtest:"⚔️ AI が分析中…",spin_audience:"🌍 視聴者を分析中…",spin_audit:"📊 監査中…",spin_community:"📣 投稿を生成中…",spin_desc:"📝 説明文を生成中…",spin_ideas:"💡 アイデアを生成中…",spin_kw:"🔍 チャンスを分析中…",spin_planner:"📅 計画を作成中…",spin_playlists:"🎞️ 再生リストを分析中…",spin_realstats:"📡 実データを読み込み中…",spin_shorts:"🎬 ショートを生成中…",spin_shorts_real:"🎬 生成中（実際の場面）…",spin_sponsor:"💼 スポンサーキットを生成中…",spin_thumbab:"📸 Vision 分析中…",stat_avg_views:"平均再生数/動画",stat_comments:"コメント",stat_engagement:"エンゲージメント",stat_freq:"投稿頻度",stat_likes:"高評価",stat_subs:"登録者",stat_tagged:"タグ付き動画",stat_tags_real:"実際のタグ",stat_total_vids:"動画総数",stat_views:"再生回数",stat_vph:"再生数/時",tk_caption:"最適化されたキャプション",tk_clips:"クリップ",tk_copy:"コピー",tk_days:"日",tk_desc_ph:"背景 / 説明（任意）…",tk_hooks:"フック",tk_ideas:"アイデア",tk_intro:"テーマを入力すると、AI が TikTok 向けのキャプション・フック・ハッシュタグ・キーワード・台本を作ります。",tk_keywords:"検索キーワード",tk_need_topic:"動画のテーマを入力してください。",tk_ready:"投稿できる状態です",tk_run:"TikTok の SEO を生成",tk_script:"構成 / 台本",tk_sound:"音源 / 音楽のヒント",tk_spin:"AI が TikTok 動画を最適化しています…",tk_tips:"ヒントと発見されやすさ",tk_topic_ph:"TikTok 動画のテーマ…",tkc_freq_ph:"ペース（例：1日1本）…",tkc_ready:"カレンダーができました",tkc_run:"7日間のカレンダーを生成",tkc_spin:"カレンダーを作成中…",tkc_title:"コンテンツカレンダー",tkh_ready:"フックができました",tkh_run:"フックを8本生成",tkh_spin:"フックを生成中…",tkh_title:"フック最適化",tki_ready:"アイデアができました",tki_run:"アイデアを10件生成",tki_spin:"バズるアイデアを探索中…",tki_title:"TikTok のバズるアイデア",tkr_intro:"YouTube 動画を開くと、AI が見どころを見つけ、TikTok 用に切り出すタイムコードを提示します。",tkr_novideo:"まず切り出したい YouTube 動画を開いてください。",tkr_ready:"切り出せるクリップ",tkr_run:"TikTok 用に変換",tkr_spin:"TikTok クリップに分割中…",tkr_title:"YouTube → TikTok"},
 ko:{analysis_done:"분석을 생성했습니다.",download:"다운로드",err_channel:"채널을 찾을 수 없습니다",ex_desc:"추가: 요약(150자) + 타임스탬프 + 키워드 + CTA + 링크",ex_em:"놀라운",ex_guide:"완전 가이드",ex_hook:"방법",export:"내보내기",gate_feat1:"+15점을 위한 우선 수정",gate_feat2:"상세 SEO 최적화",gate_feat3:"썸네일과 바이럴 후킹 조언",gate_unlock:"🔓 전부 열기: 수정, 실제 YouTube 데이터, AI…",impact_desc_no:"짧은 설명은 SEO에 불리합니다",impact_desc_ok:"설명이 잘 최적화되어 있습니다",impact_em_no:"강한 단어는 CTR을 20% 높입니다",impact_em_ok:"감정적 잠재력이 좋습니다",impact_hook_no:"제목 앞의 후킹은 클릭을 25% 높입니다",impact_hook_ok:"효과적인 CTR 후킹을 감지했습니다",kw_add_hint:"이 키워드를 제목이나 설명에 넣으면 유사 검색에서 노출이 개선될 수 있습니다.",no_result:"결과 없음",no_sugg:"제안 없음",no_sugg_more:"추가 제안이 없습니다",no_tag:"이 영상에 공개 태그가 없습니다.",pts_seo:"SEO 점수",pts_viral:"바이럴 점수",reactivate_confirm:"이 코드를 이 기기에서 해제하고 변경할까요? 코드는 다른 PC에서 다시 사용할 수 있습니다.",regenerate:"다시 생성",share:"공유",spin_abtest:"⚔️ AI 분석 중…",spin_audience:"🌍 시청자를 분석하는 중…",spin_audit:"📊 감사 중…",spin_community:"📣 게시물을 만드는 중…",spin_desc:"📝 설명을 만드는 중…",spin_ideas:"💡 아이디어를 만드는 중…",spin_kw:"🔍 기회를 분석하는 중…",spin_planner:"📅 일정을 만드는 중…",spin_playlists:"🎞️ 재생목록을 분석하는 중…",spin_realstats:"📡 실제 데이터를 불러오는 중…",spin_shorts:"🎬 Shorts를 만드는 중…",spin_shorts_real:"🎬 생성 중(실제 구간)…",spin_sponsor:"💼 스폰서 키트를 만드는 중…",spin_thumbab:"📸 Vision 분석 중…",stat_avg_views:"평균 조회수/영상",stat_comments:"댓글",stat_engagement:"참여율",stat_freq:"업로드 주기",stat_likes:"좋아요",stat_subs:"구독자",stat_tagged:"태그가 있는 영상",stat_tags_real:"실제 태그",stat_total_vids:"전체 영상",stat_views:"조회수",stat_vph:"조회수/시간",tk_caption:"최적화된 캡션",tk_clips:"클립",tk_copy:"복사",tk_days:"일",tk_desc_ph:"배경 / 설명(선택)…",tk_hooks:"후킹",tk_ideas:"아이디어",tk_intro:"주제를 입력하면 AI가 TikTok에 맞춘 캡션, 후킹, 해시태그, 키워드, 대본을 만듭니다.",tk_keywords:"검색 키워드",tk_need_topic:"영상 주제를 입력하세요.",tk_ready:"게시할 준비가 되었습니다",tk_run:"TikTok SEO 생성",tk_script:"구성 / 대본",tk_sound:"사운드 / 음악 팁",tk_spin:"AI가 TikTok 영상을 최적화하는 중…",tk_tips:"팁과 발견 가능성",tk_topic_ph:"TikTok 영상 주제…",tkc_freq_ph:"주기(예: 하루 1개)…",tkc_ready:"캘린더 완성",tkc_run:"7일 캘린더 생성",tkc_spin:"캘린더를 만드는 중…",tkc_title:"콘텐츠 캘린더",tkh_ready:"후킹 완성",tkh_run:"후킹 8개 생성",tkh_spin:"후킹을 만드는 중…",tkh_title:"후킹 최적화",tki_ready:"아이디어 완성",tki_run:"아이디어 10개 생성",tki_spin:"바이럴 아이디어를 찾는 중…",tki_title:"TikTok 바이럴 아이디어",tkr_intro:"YouTube 영상을 열면 AI가 좋은 구간을 찾아 TikTok용으로 자를 타임코드를 알려줍니다.",tkr_novideo:"먼저 재활용할 YouTube 영상을 여세요.",tkr_ready:"자를 준비가 된 클립",tkr_run:"TikTok으로 변환",tkr_spin:"TikTok 클립으로 자르는 중…",tkr_title:"YouTube → TikTok"},
 zh:{analysis_done:"分析已生成。",download:"下载",err_channel:"未找到频道",ex_desc:"补充：摘要（150 字）＋时间戳＋关键词＋行动号召＋链接",ex_em:"惊人的",ex_guide:"完整指南",ex_hook:"如何",export:"导出",gate_feat1:"优先修正，+15 分",gate_feat2:"详细的 SEO 优化",gate_feat3:"缩略图与爆款钩子建议",gate_unlock:"🔓 解锁全部：修正、YouTube 真实数据、AI…",impact_desc_no:"简介太短会拖累 SEO",impact_desc_ok:"简介优化良好",impact_em_no:"有力的词能把点击率提升 20%",impact_em_ok:"情绪张力不错",impact_hook_no:"标题开头的钩子能把点击提升 25%",impact_hook_ok:"检测到有效的点击率钩子",kw_add_hint:"把这些关键词写进标题或简介，可能提升相似搜索中的曝光。",no_result:"没有结果",no_sugg:"没有建议",no_sugg_more:"没有更多建议",no_tag:"该视频没有公开标签。",pts_seo:"SEO 分",pts_viral:"爆款分",reactivate_confirm:"要把该激活码从本设备释放并更换吗？该码可在另一台电脑上重新使用。",regenerate:"重新生成",share:"分享",spin_abtest:"⚔️ AI 正在分析…",spin_audience:"🌍 正在分析观众…",spin_audit:"📊 正在审核…",spin_community:"📣 正在生成社区帖…",spin_desc:"📝 正在生成简介…",spin_ideas:"💡 正在生成选题…",spin_kw:"🔍 正在分析机会…",spin_planner:"📅 正在生成排期…",spin_playlists:"🎞️ 正在分析播放列表…",spin_realstats:"📡 正在加载真实数据…",spin_shorts:"🎬 正在生成 Shorts…",spin_shorts_real:"🎬 正在生成（真实片段）…",spin_sponsor:"💼 正在生成赞助资料…",spin_thumbab:"📸 Vision 分析中…",stat_avg_views:"平均播放/视频",stat_comments:"评论",stat_engagement:"互动率",stat_freq:"更新频率",stat_likes:"点赞",stat_subs:"订阅者",stat_tagged:"带标签视频",stat_tags_real:"真实标签",stat_total_vids:"视频总数",stat_views:"播放量",stat_vph:"播放/小时",tk_caption:"优化后的文案",tk_clips:"片段",tk_copy:"复制",tk_days:"天",tk_desc_ph:"背景 / 描述（可选）…",tk_hooks:"开场钩子",tk_ideas:"选题",tk_intro:"给出主题：AI 会生成适配 TikTok 的文案、钩子、话题标签、关键词和脚本。",tk_keywords:"搜索关键词",tk_need_topic:"请输入一个视频主题。",tk_ready:"内容已可发布",tk_run:"生成 TikTok SEO",tk_script:"结构 / 脚本",tk_sound:"配乐建议",tk_spin:"AI 正在优化你的 TikTok 视频…",tk_tips:"技巧与可发现性",tk_topic_ph:"你的 TikTok 视频主题…",tkc_freq_ph:"节奏（例：每天 1 条）…",tkc_ready:"日历已生成",tkc_run:"生成 7 天日历",tkc_spin:"正在生成日历…",tkc_title:"内容日历",tkh_ready:"钩子已生成",tkh_run:"生成 8 个钩子",tkh_spin:"正在生成钩子…",tkh_title:"钩子优化器",tki_ready:"选题已生成",tki_run:"生成 10 个选题",tki_spin:"正在寻找爆款选题…",tki_title:"TikTok 爆款选题",tkr_intro:"打开一个 YouTube 视频：AI 会找出精彩片段，并给出裁剪成 TikTok 的时间码。",tkr_novideo:"请先打开一个 YouTube 视频再进行改造。",tkr_ready:"可裁剪的片段",tkr_run:"转成 TikTok",tkr_spin:"正在裁成 TikTok 片段…",tkr_title:"YouTube → TikTok"},
 hi:{analysis_done:"विश्लेषण तैयार हुआ।",download:"डाउनलोड",err_channel:"चैनल नहीं मिला",ex_desc:"जोड़ें: सारांश (150 अक्षर) + टाइमस्टैम्प + कीवर्ड + CTA + लिंक",ex_em:"अविश्वसनीय",ex_guide:"पूरी गाइड",ex_hook:"कैसे",export:"निर्यात",gate_feat1:"+15 अंक के लिए प्राथमिक सुधार",gate_feat2:"विस्तृत SEO अनुकूलन",gate_feat3:"थंबनेल और वायरल हुक सलाह",gate_unlock:"🔓 सब खोलें: सुधार, असली YouTube डेटा, AI…",impact_desc_no:"छोटा विवरण SEO को नुकसान पहुँचाता है",impact_desc_ok:"विवरण अच्छी तरह अनुकूलित है",impact_em_no:"असरदार शब्द CTR को 20% बढ़ाते हैं",impact_em_ok:"भावनात्मक क्षमता अच्छी है",impact_hook_no:"शीर्षक की शुरुआत में हुक क्लिक 25% बढ़ाता है",impact_hook_ok:"असरदार CTR हुक मिला",kw_add_hint:"इन कीवर्ड को शीर्षक या विवरण में जोड़ने से मिलती-जुलती खोजों में दिखना बेहतर हो सकता है।",no_result:"कोई परिणाम नहीं",no_sugg:"कोई सुझाव नहीं",no_sugg_more:"आगे कोई सुझाव नहीं",no_tag:"इस वीडियो पर कोई सार्वजनिक टैग नहीं।",pts_seo:"SEO अंक",pts_viral:"वायरल अंक",reactivate_confirm:"इस कोड को इस डिवाइस से मुक्त करके बदलें? कोड दूसरे PC पर दोबारा इस्तेमाल हो सकेगा।",regenerate:"दोबारा बनाएँ",share:"साझा करें",spin_abtest:"⚔️ AI विश्लेषण चल रहा है…",spin_audience:"🌍 दर्शकों का विश्लेषण…",spin_audit:"📊 ऑडिट चल रहा है…",spin_community:"📣 पोस्ट बन रहे हैं…",spin_desc:"📝 विवरण बन रहा है…",spin_ideas:"💡 आइडिया बन रहे हैं…",spin_kw:"🔍 अवसर का विश्लेषण…",spin_planner:"📅 योजना बन रही है…",spin_playlists:"🎞️ प्लेलिस्ट का विश्लेषण…",spin_realstats:"📡 असली डेटा लोड हो रहा है…",spin_shorts:"🎬 Shorts बन रहे हैं…",spin_shorts_real:"🎬 बन रहा है (असली अंश)…",spin_sponsor:"💼 स्पॉन्सर किट बन रही है…",spin_thumbab:"📸 Vision विश्लेषण चल रहा है…",stat_avg_views:"औसत दृश्य/वीडियो",stat_comments:"टिप्पणियाँ",stat_engagement:"जुड़ाव",stat_freq:"आवृत्ति",stat_likes:"पसंद",stat_subs:"सब्सक्राइबर",stat_tagged:"टैग वाले वीडियो",stat_tags_real:"असली टैग",stat_total_vids:"कुल वीडियो",stat_views:"दृश्य",stat_vph:"दृश्य/घंटा",tk_caption:"अनुकूलित कैप्शन",tk_clips:"क्लिप",tk_copy:"कॉपी",tk_days:"दिन",tk_desc_ph:"संदर्भ / विवरण (वैकल्पिक)…",tk_hooks:"हुक",tk_ideas:"आइडिया",tk_intro:"अपना विषय दें: AI TikTok के लिए कैप्शन, हुक, हैशटैग, कीवर्ड और स्क्रिप्ट बनाता है।",tk_keywords:"खोज कीवर्ड",tk_need_topic:"वीडियो का विषय लिखें।",tk_ready:"सामग्री प्रकाशित करने को तैयार",tk_run:"TikTok SEO बनाएँ",tk_script:"संरचना / स्क्रिप्ट",tk_sound:"ऑडियो / संगीत सुझाव",tk_spin:"AI आपका TikTok वीडियो अनुकूलित कर रहा है…",tk_tips:"सुझाव और खोज-योग्यता",tk_topic_ph:"आपके TikTok वीडियो का विषय…",tkc_freq_ph:"गति (जैसे: 1 वीडियो/दिन)…",tkc_ready:"कैलेंडर तैयार",tkc_run:"7 दिन का कैलेंडर बनाएँ",tkc_spin:"कैलेंडर बन रहा है…",tkc_title:"कंटेंट कैलेंडर",tkh_ready:"हुक तैयार",tkh_run:"8 हुक बनाएँ",tkh_spin:"हुक बन रहे हैं…",tkh_title:"हुक अनुकूलक",tki_ready:"आइडिया तैयार",tki_run:"10 आइडिया बनाएँ",tki_spin:"वायरल आइडिया खोज रहे हैं…",tki_title:"TikTok वायरल आइडिया",tkr_intro:"कोई YouTube वीडियो खोलें: AI सबसे अच्छे पल ढूँढकर TikTok के लिए काटने के टाइमकोड देता है।",tkr_novideo:"पहले कोई YouTube वीडियो खोलें ताकि उसे बदला जा सके।",tkr_ready:"काटने के लिए तैयार क्लिप",tkr_run:"TikTok में बदलें",tkr_spin:"TikTok क्लिप में काट रहे हैं…",tkr_title:"YouTube → TikTok"}
});

/* Clés atteintes par concaténation (`T("nav_"+tab)`, `T("plan_"+currentPlan)`) :
   invisibles pour une recherche littérale, elles s'affichaient en clé brute —
   `nav_tiktok` dans 11 langues et `plan_diamant` dans les 14. */
mergeI18N({
 fr:{plan_diamant:"Diamant"}, en:{plan_diamant:"Diamond"}, ar:{plan_diamant:"ماسي"},
 es:{nav_tiktok:"TikTok",plan_diamant:"Diamante"},
 pt:{nav_tiktok:"TikTok",plan_diamant:"Diamante"},
 it:{nav_tiktok:"TikTok",plan_diamant:"Diamante"},
 de:{nav_tiktok:"TikTok",plan_diamant:"Diamant"},
 nl:{nav_tiktok:"TikTok",plan_diamant:"Diamant"},
 tr:{nav_tiktok:"TikTok",plan_diamant:"Elmas"},
 ru:{nav_tiktok:"TikTok",plan_diamant:"Диамант"},
 ja:{nav_tiktok:"TikTok",plan_diamant:"ダイヤモンド"},
 ko:{nav_tiktok:"TikTok",plan_diamant:"다이아몬드"},
 zh:{nav_tiktok:"TikTok",plan_diamant:"钻石"},
 hi:{nav_tiktok:"TikTok",plan_diamant:"डायमंड"}
});

/* Étiquette du badge « généré par IA » : IA/AI/KI/ИИ selon la langue. */
mergeI18N({
 fr:{badge_ai:"IA"}, en:{badge_ai:"AI"}, ar:{badge_ai:"AI"}, es:{badge_ai:"IA"},
 pt:{badge_ai:"IA"}, it:{badge_ai:"IA"}, de:{badge_ai:"KI"}, nl:{badge_ai:"AI"},
 tr:{badge_ai:"AI"}, ru:{badge_ai:"ИИ"}, ja:{badge_ai:"AI"}, ko:{badge_ai:"AI"},
 zh:{badge_ai:"AI"}, hi:{badge_ai:"AI"}
});

/* Messages d'erreur renvoyés par le service worker sous forme de clés. */
mergeI18N({
 fr:{err_soon:"Fonctionnalité bientôt disponible.",err_not_activated:"Extension non activée.",err_upgrade:"🔒 Réservé aux abonnés Pro et Business."},
 en:{err_soon:"Feature coming soon.",err_not_activated:"Extension not activated.",err_upgrade:"🔒 Pro and Business subscribers only."},
 ar:{err_soon:"ميزة قادمة قريبًا.",err_not_activated:"الإضافة غير مفعّلة.",err_upgrade:"🔒 لمشتركي Pro و Business فقط."},
 es:{err_soon:"Función disponible pronto.",err_not_activated:"Extensión no activada.",err_upgrade:"🔒 Solo para suscriptores Pro y Business."},
 pt:{err_soon:"Funcionalidade em breve.",err_not_activated:"Extensão não ativada.",err_upgrade:"🔒 Apenas para subscritores Pro e Business."},
 it:{err_soon:"Funzione presto disponibile.",err_not_activated:"Estensione non attivata.",err_upgrade:"🔒 Solo per abbonati Pro e Business."},
 de:{err_soon:"Funktion kommt bald.",err_not_activated:"Erweiterung nicht aktiviert.",err_upgrade:"🔒 Nur für Pro- und Business-Abos."},
 nl:{err_soon:"Functie komt binnenkort.",err_not_activated:"Extensie niet geactiveerd.",err_upgrade:"🔒 Alleen voor Pro- en Business-abonnees."},
 tr:{err_soon:"Bu özellik yakında.",err_not_activated:"Uzantı etkin değil.",err_upgrade:"🔒 Yalnızca Pro ve Business aboneleri."},
 ru:{err_soon:"Функция скоро появится.",err_not_activated:"Расширение не активировано.",err_upgrade:"🔒 Только для подписок Pro и Business."},
 ja:{err_soon:"この機能は近日公開です。",err_not_activated:"拡張機能が有効化されていません。",err_upgrade:"🔒 Pro と Business のみ。"},
 ko:{err_soon:"곧 제공되는 기능입니다.",err_not_activated:"확장이 활성화되지 않았습니다.",err_upgrade:"🔒 Pro와 Business 전용입니다."},
 zh:{err_soon:"该功能即将推出。",err_not_activated:"扩展尚未激活。",err_upgrade:"🔒 仅限 Pro 与 Business 订阅。"},
 hi:{err_soon:"यह सुविधा जल्द आ रही है।",err_not_activated:"एक्सटेंशन सक्रिय नहीं है।",err_upgrade:"🔒 केवल Pro और Business ग्राहकों के लिए।"}
});

/* Trois derniers textes qui échappaient à l'i18n : une erreur de lecture d'image,
   un garde-fou de l'A/B test, et le sentinel d'extension rechargée. */
mergeI18N({
 fr:{err_image:"Image illisible.",abtest_need2:"Remplis les deux titres.",err_ctx:"Extension mise à jour : recharge la page YouTube."},
 en:{err_image:"Unreadable image.",abtest_need2:"Fill in both titles.",err_ctx:"Extension updated: reload the YouTube page."},
 ar:{err_image:"صورة غير قابلة للقراءة.",abtest_need2:"املأ العنوانين.",err_ctx:"تم تحديث الإضافة: أعد تحميل صفحة يوتيوب."},
 es:{err_image:"Imagen ilegible.",abtest_need2:"Rellena los dos títulos.",err_ctx:"Extensión actualizada: recarga la página de YouTube."},
 pt:{err_image:"Imagem ilegível.",abtest_need2:"Preencha os dois títulos.",err_ctx:"Extensão atualizada: recarregue a página do YouTube."},
 it:{err_image:"Immagine illeggibile.",abtest_need2:"Compila i due titoli.",err_ctx:"Estensione aggiornata: ricarica la pagina YouTube."},
 de:{err_image:"Bild nicht lesbar.",abtest_need2:"Fülle beide Titel aus.",err_ctx:"Erweiterung aktualisiert: lade die YouTube-Seite neu."},
 nl:{err_image:"Onleesbare afbeelding.",abtest_need2:"Vul beide titels in.",err_ctx:"Extensie bijgewerkt: herlaad de YouTube-pagina."},
 tr:{err_image:"Okunamayan görsel.",abtest_need2:"İki başlığı da doldur.",err_ctx:"Uzantı güncellendi: YouTube sayfasını yenile."},
 ru:{err_image:"Изображение не читается.",abtest_need2:"Заполни оба заголовка.",err_ctx:"Расширение обновлено: перезагрузи страницу YouTube."},
 ja:{err_image:"画像を読み取れません。",abtest_need2:"2つのタイトルを入力してください。",err_ctx:"拡張機能が更新されました。YouTube のページを再読み込みしてください。"},
 ko:{err_image:"이미지를 읽을 수 없습니다.",abtest_need2:"두 제목을 모두 입력하세요.",err_ctx:"확장이 업데이트되었습니다. YouTube 페이지를 새로고침하세요."},
 zh:{err_image:"无法读取该图片。",abtest_need2:"请填写两个标题。",err_ctx:"扩展已更新：请重新加载 YouTube 页面。"},
 hi:{err_image:"छवि पढ़ी नहीं जा सकी।",abtest_need2:"दोनों शीर्षक भरें।",err_ctx:"एक्सटेंशन अपडेट हुआ: YouTube पेज दोबारा लोड करें।"}
});

/* ── FIX_I18N : textes auparavant codés en dur (checklist, stats, spinners, gate) ── */
const FIX_I18N = {
 fr:{ pts_seo:"points SEO", pts_viral:"points Viral", ex_guide:"Guide complet", ex_em:"Incroyable", ex_hook:"Comment", ex_desc:"Ajouter : résumé (150 car.) + timestamps + mots-clés + CTA + liens", impact_em_ok:"Bon potentiel émotionnel", impact_em_no:"Les mots forts augmentent le CTR de 20%", impact_hook_ok:"Hook CTR efficace détecté", impact_hook_no:"Un hook en début de titre augmente les clics de 25%", impact_desc_ok:"Description bien optimisée", impact_desc_no:"Une description courte réduit le référencement", cl_punct_label:"Ponctuation CTR (? ou !)", kw_add_hint:"Ajouter ces mots-clés dans le titre ou la description peut améliorer la visibilité dans les recherches similaires.", stat_views:"Vues", stat_vph:"Vues/heure", stat_likes:"J'aime", stat_comments:"Commentaires", stat_engagement:"Engagement", stat_subs:"Abonnés", stat_avg_views:"Vues moy/vidéo", stat_freq:"Fréquence", stat_tagged:"Vidéos taguées", stat_total_vids:"Vidéos total", stat_tags_real:"Tags réels", no_tag:"Aucun tag public sur cette vidéo.", err_channel:"Chaîne introuvable", no_result:"Aucun résultat", no_sugg:"Aucune suggestion", no_sugg_more:"Aucune suggestion supplémentaire", spin_realstats:"📡 Chargement des vraies données…", spin_audit:"📊 Audit en cours…", spin_kw:"🔍 Analyse d'opportunité…", spin_playlists:"🎞️ Analyse des playlists…", spin_planner:"📅 Création du planning…", spin_community:"📣 Génération des posts…", spin_ideas:"💡 Génération des idées…", spin_sponsor:"💼 Génération du kit sponsor…", spin_audience:"🌍 Analyse de l'audience…", spin_abtest:"⚔️ Analyse IA en cours…", spin_thumbab:"📸 Analyse Vision en cours…", spin_desc:"📝 Génération de la description…", spin_shorts:"🎬 Génération des Shorts…", spin_shorts_real:"🎬 Génération (passages réels)…", reactivate_tip:"Changer de code / Réactiver", reactivate_confirm:"Libérer ce code de cet appareil et changer de code ? Le code pourra être réutilisé sur un autre PC.", analysis_done:"Analyse générée.", gate_feat1:"Correction prioritaire pour +15 pts", gate_feat2:"Optimisation SEO détaillée", gate_feat3:"Conseil miniature & hook viral", gate_unlock:"🔓 Débloque tout : corrections, vraies données YouTube, IA…" },
 en:{ pts_seo:"SEO points", pts_viral:"Viral points", ex_guide:"Complete Guide", ex_em:"Amazing", ex_hook:"How to", ex_desc:"Add: summary (150 chars) + timestamps + keywords + CTA + links", impact_em_ok:"Good emotional potential", impact_em_no:"Power words boost CTR by 20%", impact_hook_ok:"Effective CTR hook detected", impact_hook_no:"A hook at the title start boosts clicks by 25%", impact_desc_ok:"Well-optimized description", impact_desc_no:"A short description hurts SEO", cl_punct_label:"CTR Punctuation (? or !)", kw_add_hint:"Adding these keywords to the title or description can improve visibility in similar searches.", stat_views:"Views", stat_vph:"Views/hour", stat_likes:"Likes", stat_comments:"Comments", stat_engagement:"Engagement", stat_subs:"Subscribers", stat_avg_views:"Avg views/video", stat_freq:"Frequency", stat_tagged:"Tagged videos", stat_total_vids:"Total videos", stat_tags_real:"Real tags", no_tag:"No public tags on this video.", err_channel:"Channel not found", no_result:"No result", no_sugg:"No suggestion", no_sugg_more:"No further suggestions", spin_realstats:"📡 Loading real data…", spin_audit:"📊 Auditing…", spin_kw:"🔍 Analyzing opportunity…", spin_playlists:"🎞️ Analyzing playlists…", spin_planner:"📅 Building the plan…", spin_community:"📣 Generating posts…", spin_ideas:"💡 Generating ideas…", spin_sponsor:"💼 Generating sponsor kit…", spin_audience:"🌍 Analyzing the audience…", spin_abtest:"⚔️ AI analysis in progress…", spin_thumbab:"📸 Vision analysis in progress…", spin_desc:"📝 Generating the description…", spin_shorts:"🎬 Generating Shorts…", spin_shorts_real:"🎬 Generating (real clips)…", reactivate_tip:"Change code / Reactivate", reactivate_confirm:"Release this code from this device and change code? The code can be reused on another PC.", analysis_done:"Analysis generated.", gate_feat1:"Priority fix for +15 pts", gate_feat2:"Detailed SEO optimization", gate_feat3:"Thumbnail & viral hook advice", gate_unlock:"🔓 Unlock everything: fixes, real YouTube data, AI…" },
 ar:{ pts_seo:"نقطة SEO", pts_viral:"نقطة فيروسية", ex_guide:"دليل كامل", ex_em:"مذهل", ex_hook:"كيف", ex_desc:"أضف: ملخّص (150 حرف) + طوابع زمنية + كلمات مفتاحية + CTA + روابط", impact_em_ok:"إمكانات عاطفية جيدة", impact_em_no:"الكلمات القوية تزيد CTR بنسبة 20%", impact_hook_ok:"تم رصد خطّاف CTR فعّال", impact_hook_no:"خطّاف في بداية العنوان يزيد النقرات بنسبة 25%", impact_desc_ok:"وصف محسّن جيدًا", impact_desc_no:"الوصف القصير يضرّ بالـ SEO", cl_punct_label:"ترقيم CTR (؟ أو !)", kw_add_hint:"إضافة هذه الكلمات المفتاحية في العنوان أو الوصف قد يحسّن الظهور في عمليات البحث المشابهة.", stat_views:"المشاهدات", stat_vph:"مشاهدات/ساعة", stat_likes:"إعجابات", stat_comments:"التعليقات", stat_engagement:"التفاعل", stat_subs:"المشتركون", stat_avg_views:"متوسط المشاهدات/فيديو", stat_freq:"التكرار", stat_tagged:"فيديوهات موسومة", stat_total_vids:"إجمالي الفيديوهات", stat_tags_real:"وسوم حقيقية", no_tag:"لا توجد وسوم عامة على هذا الفيديو.", err_channel:"القناة غير موجودة", no_result:"لا نتائج", no_sugg:"لا اقتراحات", no_sugg_more:"لا اقتراحات إضافية", spin_realstats:"📡 جارٍ تحميل البيانات الحقيقية…", spin_audit:"📊 جارٍ التدقيق…", spin_kw:"🔍 جارٍ تحليل الفرص…", spin_playlists:"🎞️ جارٍ تحليل قوائم التشغيل…", spin_planner:"📅 جارٍ إنشاء الخطة…", spin_community:"📣 جارٍ توليد المنشورات…", spin_ideas:"💡 جارٍ توليد الأفكار…", spin_sponsor:"💼 جارٍ توليد حزمة الرعاية…", spin_audience:"🌍 جارٍ تحليل الجمهور…", spin_abtest:"⚔️ جارٍ تحليل الذكاء الاصطناعي…", spin_thumbab:"📸 جارٍ تحليل Vision…", spin_desc:"📝 جارٍ توليد الوصف…", spin_shorts:"🎬 جارٍ توليد Shorts…", spin_shorts_real:"🎬 جارٍ التوليد (مقاطع حقيقية)…", reactivate_tip:"تغيير الكود / إعادة التفعيل", reactivate_confirm:"تحرير هذا الكود من هذا الجهاز وتغيير الكود؟ يمكن إعادة استخدام الكود على جهاز آخر.", analysis_done:"تم توليد التحليل.", gate_feat1:"تصحيح ذو أولوية لـ +15 نقطة", gate_feat2:"تحسين SEO مفصّل", gate_feat3:"نصائح الصورة المصغّرة والخطّاف الفيروسي", gate_unlock:"🔓 افتح كل شيء: التصحيحات، بيانات يوتيوب الحقيقية، الذكاء الاصطناعي…" }
};
Object.keys(FIX_I18N).forEach(l=>{ if(I18N[l]){ for(const k in FIX_I18N[l]){ if(!(k in I18N[l])) I18N[l][k]=FIX_I18N[l][k]; } } });

/* Panneau d'activation (1er écran vu par un nouvel utilisateur, avant tout chargement de langue stockée) */
const ACT_I18N = {
 fr:{ act_subtitle:"Entrez votre ID et Secret du dashboard", act_id_label:"ID d'activation", act_secret_label:"Code Secret", act_secret_placeholder:"Secret...", act_btn_activate:"Activer l'extension", act_btn_dashboard:"Obtenir l'ID et Secret", act_verifying:"Vérification...", act_err_missing:"Entrez l'ID et le Secret", act_err_generic:"Erreur", act_success:"Extension activée !" },
 en:{ act_subtitle:"Enter your dashboard ID and Secret", act_id_label:"Activation ID", act_secret_label:"Secret Code", act_secret_placeholder:"Secret...", act_btn_activate:"Activate extension", act_btn_dashboard:"Get ID & Secret", act_verifying:"Verifying...", act_err_missing:"Enter the ID and Secret", act_err_generic:"Error", act_success:"Extension activated!" },
 ar:{ act_subtitle:"أدخل معرّف والرمز السري من لوحة التحكم", act_id_label:"معرّف التفعيل", act_secret_label:"الرمز السري", act_secret_placeholder:"الرمز السري...", act_btn_activate:"تفعيل الإضافة", act_btn_dashboard:"الحصول على المعرّف والرمز السري", act_verifying:"جارٍ التحقق...", act_err_missing:"أدخل المعرّف والرمز السري", act_err_generic:"خطأ", act_success:"تم تفعيل الإضافة!" },
 zh:{ act_subtitle:"输入您仪表盘的 ID 和密钥", act_id_label:"激活 ID", act_secret_label:"密钥", act_secret_placeholder:"密钥...", act_btn_activate:"激活扩展程序", act_btn_dashboard:"获取 ID 和密钥", act_verifying:"验证中...", act_err_missing:"请输入 ID 和密钥", act_err_generic:"错误", act_success:"扩展程序已激活！" },
 hi:{ act_subtitle:"अपने डैशबोर्ड का ID और सीक्रेट दर्ज करें", act_id_label:"एक्टिवेशन ID", act_secret_label:"सीक्रेट कोड", act_secret_placeholder:"सीक्रेट...", act_btn_activate:"एक्सटेंशन सक्रिय करें", act_btn_dashboard:"ID और सीक्रेट प्राप्त करें", act_verifying:"सत्यापन हो रहा है...", act_err_missing:"ID और सीक्रेट दर्ज करें", act_err_generic:"त्रुटि", act_success:"एक्सटेंशन सक्रिय हो गया!" },
 ja:{ act_subtitle:"ダッシュボードのIDとシークレットを入力してください", act_id_label:"アクティベーションID", act_secret_label:"シークレットコード", act_secret_placeholder:"シークレット...", act_btn_activate:"拡張機能を有効化", act_btn_dashboard:"IDとシークレットを取得", act_verifying:"確認中...", act_err_missing:"IDとシークレットを入力してください", act_err_generic:"エラー", act_success:"拡張機能が有効化されました！" },
 ru:{ act_subtitle:"Введите ID и Секретный код из личного кабинета", act_id_label:"ID активации", act_secret_label:"Секретный код", act_secret_placeholder:"Секрет...", act_btn_activate:"Активировать расширение", act_btn_dashboard:"Получить ID и Секрет", act_verifying:"Проверка...", act_err_missing:"Введите ID и Секрет", act_err_generic:"Ошибка", act_success:"Расширение активировано!" },
 es:{ act_subtitle:"Introduce tu ID y Secreto del panel", act_id_label:"ID de activación", act_secret_label:"Código secreto", act_secret_placeholder:"Secreto...", act_btn_activate:"Activar extensión", act_btn_dashboard:"Obtener ID y Secreto", act_verifying:"Verificando...", act_err_missing:"Introduce el ID y el Secreto", act_err_generic:"Error", act_success:"¡Extensión activada!" },
 pt:{ act_subtitle:"Insira o seu ID e Código Secreto do painel", act_id_label:"ID de ativação", act_secret_label:"Código secreto", act_secret_placeholder:"Secreto...", act_btn_activate:"Ativar extensão", act_btn_dashboard:"Obter ID e Secreto", act_verifying:"Verificando...", act_err_missing:"Insira o ID e o Secreto", act_err_generic:"Erro", act_success:"Extensão ativada!" },
 de:{ act_subtitle:"Gib deine ID und dein Secret aus dem Dashboard ein", act_id_label:"Aktivierungs-ID", act_secret_label:"Geheimcode", act_secret_placeholder:"Geheimcode...", act_btn_activate:"Erweiterung aktivieren", act_btn_dashboard:"ID & Geheimcode erhalten", act_verifying:"Wird überprüft...", act_err_missing:"Gib die ID und den Geheimcode ein", act_err_generic:"Fehler", act_success:"Erweiterung aktiviert!" },
 ko:{ act_subtitle:"대시보드의 ID와 시크릿 코드를 입력하세요", act_id_label:"활성화 ID", act_secret_label:"시크릿 코드", act_secret_placeholder:"시크릿...", act_btn_activate:"확장 프로그램 활성화", act_btn_dashboard:"ID 및 시크릿 받기", act_verifying:"확인 중...", act_err_missing:"ID와 시크릿을 입력하세요", act_err_generic:"오류", act_success:"확장 프로그램이 활성화되었습니다!" },
 tr:{ act_subtitle:"Panonuzdaki Kimlik ve Gizli Kodu girin", act_id_label:"Aktivasyon Kimliği", act_secret_label:"Gizli Kod", act_secret_placeholder:"Gizli kod...", act_btn_activate:"Uzantıyı etkinleştir", act_btn_dashboard:"Kimlik ve Gizli Kodu al", act_verifying:"Doğrulanıyor...", act_err_missing:"Kimlik ve Gizli Kodu girin", act_err_generic:"Hata", act_success:"Uzantı etkinleştirildi!" },
 it:{ act_subtitle:"Inserisci il tuo ID e Codice segreto dalla dashboard", act_id_label:"ID di attivazione", act_secret_label:"Codice segreto", act_secret_placeholder:"Codice segreto...", act_btn_activate:"Attiva estensione", act_btn_dashboard:"Ottieni ID e Codice segreto", act_verifying:"Verifica in corso...", act_err_missing:"Inserisci ID e Codice segreto", act_err_generic:"Errore", act_success:"Estensione attivata!" },
 nl:{ act_subtitle:"Voer je ID en Geheime code van het dashboard in", act_id_label:"Activatie-ID", act_secret_label:"Geheime code", act_secret_placeholder:"Geheime code...", act_btn_activate:"Extensie activeren", act_btn_dashboard:"ID en Geheime code ophalen", act_verifying:"Verifiëren...", act_err_missing:"Voer de ID en Geheime code in", act_err_generic:"Fout", act_success:"Extensie geactiveerd!" }
};
Object.keys(ACT_I18N).forEach(l=>{ if(I18N[l]){ for(const k in ACT_I18N[l]){ if(!(k in I18N[l])) I18N[l][k]=ACT_I18N[l][k]; } } });

/* Erreurs d'activation renvoyées par l'API (backend en français) → traduites côté client
   par mappage statut/flag/code, pour que l'utilisateur les voie dans SA langue. */
const ACT_ERR_I18N = {
 fr:{ act_err_invalid:"ID ou Secret invalide", act_err_expired:"Abonnement expiré", act_err_device:"Ce code est déjà actif sur un autre appareil. Libère-le (bouton 🔑) ou via le dashboard." },
 en:{ act_err_invalid:"Invalid ID or Secret", act_err_expired:"Subscription expired", act_err_device:"This code is already active on another device. Release it (🔑 button) or from the dashboard." },
 ar:{ act_err_invalid:"معرّف أو رمز سري غير صالح", act_err_expired:"انتهى الاشتراك", act_err_device:"هذا الكود مُفعّل بالفعل على جهاز آخر. حرّره (زر 🔑) أو من لوحة التحكم." },
 zh:{ act_err_invalid:"ID 或密钥无效", act_err_expired:"订阅已过期", act_err_device:"此密钥已在另一台设备上激活。请释放它（🔑 按钮）或通过仪表盘操作。" },
 hi:{ act_err_invalid:"अमान्य ID या सीक्रेट", act_err_expired:"सदस्यता समाप्त हो गई", act_err_device:"यह कोड पहले से किसी अन्य डिवाइस पर सक्रिय है। इसे रिलीज़ करें (🔑 बटन) या डैशबोर्ड से।" },
 ja:{ act_err_invalid:"IDまたはシークレットが無効です", act_err_expired:"サブスクリプションの有効期限が切れています", act_err_device:"このコードは別のデバイスで既に有効です。解放してください（🔑ボタン）またはダッシュボードから。" },
 ru:{ act_err_invalid:"Неверный ID или Секрет", act_err_expired:"Подписка истекла", act_err_device:"Этот код уже активен на другом устройстве. Освободите его (кнопка 🔑) или через личный кабинет." },
 es:{ act_err_invalid:"ID o Secreto no válido", act_err_expired:"Suscripción caducada", act_err_device:"Este código ya está activo en otro dispositivo. Libéralo (botón 🔑) o desde el panel." },
 pt:{ act_err_invalid:"ID ou Secreto inválido", act_err_expired:"Assinatura expirada", act_err_device:"Este código já está ativo noutro dispositivo. Liberte-o (botão 🔑) ou pelo painel." },
 de:{ act_err_invalid:"Ungültige ID oder Geheimcode", act_err_expired:"Abo abgelaufen", act_err_device:"Dieser Code ist bereits auf einem anderen Gerät aktiv. Gib ihn frei (🔑-Schaltfläche) oder über das Dashboard." },
 ko:{ act_err_invalid:"잘못된 ID 또는 시크릿", act_err_expired:"구독이 만료되었습니다", act_err_device:"이 코드는 이미 다른 기기에서 활성화되어 있습니다. 해제하세요(🔑 버튼) 또는 대시보드에서." },
 tr:{ act_err_invalid:"Geçersiz Kimlik veya Gizli Kod", act_err_expired:"Abonelik süresi doldu", act_err_device:"Bu kod başka bir cihazda zaten etkin. Serbest bırakın (🔑 düğmesi) veya panodan." },
 it:{ act_err_invalid:"ID o Codice segreto non valido", act_err_expired:"Abbonamento scaduto", act_err_device:"Questo codice è già attivo su un altro dispositivo. Liberalo (pulsante 🔑) o dalla dashboard." },
 nl:{ act_err_invalid:"Ongeldige ID of Geheime code", act_err_expired:"Abonnement verlopen", act_err_device:"Deze code is al actief op een ander apparaat. Geef hem vrij (🔑-knop) of via het dashboard." }
};
Object.keys(ACT_ERR_I18N).forEach(l=>{ if(I18N[l]){ for(const k in ACT_ERR_I18N[l]){ if(!(k in I18N[l])) I18N[l][k]=ACT_ERR_I18N[l][k]; } } });




/* Traduction courante — détectée depuis la langue du navigateur au 1er lancement
   (avant qu'un éventuel echoLanguage stocké ne soit chargé, cf. bootstrap plus bas).
   Corrige le panneau d'activation qui s'affichait toujours en français pour un
   nouvel utilisateur non-francophone. */
function detectBrowserLanguage(){
  const supported = ["fr","en","ar","zh","hi","ja","ru","es","pt","de","ko","tr","it","nl"];
  const primary = (navigator.language || navigator.userLanguage || "en").toLowerCase().split("-")[0];
  return supported.includes(primary) ? primary : "en";
}
let currentLanguage = detectBrowserLanguage();
const CURRENT_YEAR = String(new Date().getFullYear());
function T(key) {
  const L = I18N[currentLanguage] || I18N.en;
  const v = L[key] !== undefined ? L[key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
  /* Les dictionnaires contiennent des exemples datés (« Guide complet 2024 »,
     « 5 astuces, 2024 ») écrits en dur dans les 14 langues. Plutôt que de les
     réécrire à chaque nouvelle année, l'année passée est remplacée par l'année
     courante à la lecture : aucun conseil affiché ne peut plus être périmé. */
  return typeof v === "string" ? v.replace(/(?<![0-9])20[0-9]{2}(?![0-9])/g, CURRENT_YEAR) : v;
}

/* ══════════════════════════════════════════════════════════════
   ÉTAT GLOBAL
══════════════════════════════════════════════════════════════ */
let currentVideoId  = null;
let currentPlan     = "free";   /* free | pro | business */
let currentUserToken = null;
let currentUserEmail = null;
let currentUserAvatar = null;
let currentUserName = null;
let panelMounted    = false;
let panelCreating   = false; // Verrou anti-doublon
let lastUrl         = location.href;
let _shellRealPanelHidden = false; // true si #echo-rank-panel a été masqué/rattaché par le shell
let activeTab       = "coach";
let activeSection   = "coach";
/* Dernier {data,scores,checklist} rendu : le popup (fenêtre séparée, aucune
   variable en commun) déclenche l'ouverture d'une section via un message
   runtime ; le panneau a besoin de ces trois valeurs pour rejouer switchTab(). */
let lastPanelData=null, lastPanelScores=null, lastPanelChecklist=null;
/* Regroupement des 17 onglets en 5 sections (réutilise les renderX existants) */
/* L'ordre des sections EST le parcours du copilote :
   analyse (Coach) → corrections (Analyser/Créer/Studio) → Publication → Suivi → Croissance. */
const SECTIONS = [
  { id:"coach",      icon:"🧠", key:"sec_coach",      tabs:["coach"] },
  { id:"analyser",   icon:"🔍", key:"sec_analyser",   tabs:["overview","seo","viral","competitor","channel","comments"] },
  { id:"creer",      icon:"✍️", key:"sec_creer",      tabs:["titles","abtest","shorts","tiktok","ideas","actions"] },
  { id:"studio",     icon:"🎨", key:"sec_studio",     tabs:["thumbnail"] },
  { id:"publier",    icon:"🚀", key:"sec_publier",    tabs:["publish"] },
  { id:"suivi",      icon:"📊", key:"sec_suivi",      tabs:["track"] },
  { id:"croissance", icon:"📈", key:"sec_croissance", tabs:["growth","trends","planner","region","revenue","sponsor"] }
];
function sectionOf(tab){ const s=SECTIONS.find(x=>x.tabs.includes(tab)); return s?s.id:"coach"; }

/* ══════════════════════════════════════════════════════════════
   SHELL — bouton(s) dans la barre YouTube + panneaux repliables
   (principe TubeBuddy : accessible immédiatement, sans activation).
   Dictionnaire local minimal (FR/EN) — n'entre PAS dans le système I18N
   principal (14 langues) pour ne rien risquer dessus ; repli EN sinon.
══════════════════════════════════════════════════════════════ */
const SHELL_STRINGS = {
  fr:{ shell_title:"VidSpark AI", shell_locked:"Connecte ton compte pour débloquer", shell_connect:"Se connecter",
       shell_dashboard:"Tableau de bord", shell_close:"Fermer", side_title:"Mon compte", side_notconnected:"Non connecté",
       side_plan:"Forfait", side_upgrade:"Passer Pro", side_support:"Support", side_free:"Free",
       sec_desc_coach:"Analyse ta vidéo et te dit quoi corriger, dans l'ordre.",
       sec_desc_analyser:"Score SEO, tags, concurrents, commentaires — vue complète.",
       sec_desc_creer:"Titres, A/B test, Shorts, TikTok, idées de vidéos par IA.",
       sec_desc_studio:"Génère et améliore tes miniatures avec l'IA.",
       sec_desc_publier:"Checklist avant publication, pour ne rien oublier.",
       sec_desc_suivi:"Suis l'évolution de ton classement dans le temps.",
       sec_desc_croissance:"Tendances, planning, revenus, sponsors — vue chaîne.",
       shell_locked_badge:"🔒", shell_open:"Ouvrir",
       stats_views:"Vues", stats_comments:"Commentaires", stats_likes:"J'aime",
       stats_seo:"Score SEO", stats_viral:"Score Viral", stats_global:"Score Global", stats_tags:"Tags",
       stats_summary:"Résumé", stats_scores:"Scores", stats_channel:"Chaîne", stats_subscribers:"Abonnés",
       stats_total_views:"Vues totales", stats_videos:"Vidéos",
       stats_click_load:"clic pour charger", stats_na:"—",
       insights_title:"Recherche concurrents", insights_close:"Fermer",
       insights_search_ph:"Mot-clé, sujet ou niche…", insights_search_btn:"Rechercher",
       insights_views:"vues", insights_per_hour:"/h", insights_empty:"Aucun résultat pour cette recherche.",
       stats_growth:"Croissance", stats_growth_start:"Suivi démarré aujourd'hui — reviens dans quelques jours pour voir l'évolution.",
       stats_growth_days:"sur {n} jours", stats_locked_title:"Statistiques Pro",
       qm_open:"Ouvrir VidSpark", qm_signin:"Se connecter pour débloquer",
       qm_need_video:"Ouvre une vidéo YouTube pour accéder à l'analyse." },
  en:{ shell_title:"VidSpark AI", shell_locked:"Connect your account to unlock", shell_connect:"Sign in",
       shell_dashboard:"Dashboard", shell_close:"Close", side_title:"My account", side_notconnected:"Not connected",
       side_plan:"Plan", side_upgrade:"Upgrade", side_support:"Support", side_free:"Free",
       sec_desc_coach:"Analyzes your video and tells you what to fix, in order.",
       sec_desc_analyser:"SEO score, tags, competitors, comments — full view.",
       sec_desc_creer:"Titles, A/B testing, Shorts, TikTok, AI video ideas.",
       sec_desc_studio:"Generate and improve your thumbnails with AI.",
       sec_desc_publier:"Pre-publish checklist, so nothing gets missed.",
       sec_desc_suivi:"Track your ranking over time.",
       sec_desc_croissance:"Trends, planning, revenue, sponsors — channel view.",
       shell_locked_badge:"🔒", shell_open:"Open",
       stats_views:"Views", stats_comments:"Comments", stats_likes:"Likes",
       stats_seo:"SEO Score", stats_viral:"Viral Score", stats_global:"Global Score", stats_tags:"Tags",
       stats_summary:"Summary", stats_scores:"Scores", stats_channel:"Channel", stats_subscribers:"Subscribers",
       stats_total_views:"Total Views", stats_videos:"Videos",
       stats_click_load:"click to load", stats_na:"—",
       insights_title:"Competitor Search", insights_close:"Close",
       insights_search_ph:"Keyword, topic or niche…", insights_search_btn:"Search",
       insights_views:"views", insights_per_hour:"/h", insights_empty:"No results for this search.",
       stats_growth:"Growth", stats_growth_start:"Tracking started today — check back in a few days to see the trend.",
       stats_growth_days:"over {n} days", stats_locked_title:"Pro Statistics",
       qm_open:"Open VidSpark", qm_signin:"Sign in to unlock",
       qm_need_video:"Open a YouTube video to access the analysis." },
  ar:{ stats_views:"المشاهدات", stats_comments:"التعليقات", stats_likes:"الإعجابات",
       stats_seo:"نقاط SEO", stats_viral:"نقاط الانتشار", stats_global:"النقاط الإجمالية", stats_tags:"الوسوم",
       stats_summary:"الملخص", stats_scores:"النقاط", stats_channel:"القناة", stats_subscribers:"المشتركون",
       stats_total_views:"إجمالي المشاهدات", stats_videos:"الفيديوهات",
       stats_click_load:"انقر للتحميل", stats_na:"—",
       stats_growth:"النمو", stats_growth_start:"بدأ التتبع اليوم — عد خلال بضعة أيام لرؤية التطور.",
       stats_growth_days:"خلال {n} يوم", stats_locked_title:"إحصائيات برو",
       qm_open:"فتح VidSpark", qm_signin:"سجّل الدخول للفتح",
       qm_need_video:"افتح فيديو يوتيوب للوصول إلى التحليل." },
  zh:{ stats_views:"观看次数", stats_comments:"评论", stats_likes:"点赞",
       stats_seo:"SEO 分数", stats_viral:"病毒分数", stats_global:"总分", stats_tags:"标签",
       stats_summary:"摘要", stats_scores:"分数", stats_channel:"频道", stats_subscribers:"订阅者",
       stats_total_views:"总观看次数", stats_videos:"视频数",
       stats_click_load:"点击加载", stats_na:"—",
       stats_growth:"增长", stats_growth_start:"今天开始追踪 — 几天后回来查看趋势。",
       stats_growth_days:"过去 {n} 天", stats_locked_title:"专业版统计",
       qm_open:"打开 VidSpark", qm_signin:"登录以解锁",
       qm_need_video:"打开一个 YouTube 视频以查看分析。" },
  hi:{ stats_views:"व्यूज़", stats_comments:"टिप्पणियाँ", stats_likes:"लाइक्स",
       stats_seo:"SEO स्कोर", stats_viral:"वायरल स्कोर", stats_global:"कुल स्कोर", stats_tags:"टैग",
       stats_summary:"सारांश", stats_scores:"स्कोर", stats_channel:"चैनल", stats_subscribers:"सब्सक्राइबर",
       stats_total_views:"कुल व्यूज़", stats_videos:"वीडियो",
       stats_click_load:"लोड करने के लिए क्लिक करें", stats_na:"—",
       stats_growth:"ग्रोथ", stats_growth_start:"आज से ट्रैकिंग शुरू — रुझान देखने के लिए कुछ दिनों बाद वापस आएं।",
       stats_growth_days:"{n} दिनों में", stats_locked_title:"प्रो आँकड़े",
       qm_open:"VidSpark खोलें", qm_signin:"अनलॉक करने के लिए लॉगिन करें",
       qm_need_video:"विश्लेषण देखने के लिए एक YouTube वीडियो खोलें।" },
  ja:{ stats_views:"再生回数", stats_comments:"コメント", stats_likes:"高評価",
       stats_seo:"SEOスコア", stats_viral:"バイラルスコア", stats_global:"総合スコア", stats_tags:"タグ",
       stats_summary:"概要", stats_scores:"スコア", stats_channel:"チャンネル", stats_subscribers:"登録者数",
       stats_total_views:"総再生回数", stats_videos:"動画数",
       stats_click_load:"クリックして読み込む", stats_na:"—",
       stats_growth:"成長", stats_growth_start:"本日から記録を開始しました — 数日後に推移を確認できます。",
       stats_growth_days:"{n}日間", stats_locked_title:"Pro統計",
       qm_open:"VidSparkを開く", qm_signin:"ログインして解除",
       qm_need_video:"分析にアクセスするにはYouTube動画を開いてください。" },
  ru:{ stats_views:"Просмотры", stats_comments:"Комментарии", stats_likes:"Лайки",
       stats_seo:"SEO-оценка", stats_viral:"Вирусная оценка", stats_global:"Общая оценка", stats_tags:"Теги",
       stats_summary:"Сводка", stats_scores:"Оценки", stats_channel:"Канал", stats_subscribers:"Подписчики",
       stats_total_views:"Всего просмотров", stats_videos:"Видео",
       stats_click_load:"нажмите, чтобы загрузить", stats_na:"—",
       stats_growth:"Рост", stats_growth_start:"Отслеживание начато сегодня — загляните через несколько дней, чтобы увидеть динамику.",
       stats_growth_days:"за {n} дн.", stats_locked_title:"Pro-статистика",
       qm_open:"Открыть VidSpark", qm_signin:"Войдите, чтобы разблокировать",
       qm_need_video:"Откройте видео на YouTube, чтобы увидеть анализ." },
  es:{ stats_views:"Vistas", stats_comments:"Comentarios", stats_likes:"Me gusta",
       stats_seo:"Puntuación SEO", stats_viral:"Puntuación viral", stats_global:"Puntuación global", stats_tags:"Etiquetas",
       stats_summary:"Resumen", stats_scores:"Puntuaciones", stats_channel:"Canal", stats_subscribers:"Suscriptores",
       stats_total_views:"Vistas totales", stats_videos:"Vídeos",
       stats_click_load:"clic para cargar", stats_na:"—",
       stats_growth:"Crecimiento", stats_growth_start:"Seguimiento iniciado hoy — vuelve en unos días para ver la tendencia.",
       stats_growth_days:"en {n} días", stats_locked_title:"Estadísticas Pro",
       qm_open:"Abrir VidSpark", qm_signin:"Inicia sesión para desbloquear",
       qm_need_video:"Abre un vídeo de YouTube para acceder al análisis." },
  pt:{ stats_views:"Visualizações", stats_comments:"Comentários", stats_likes:"Curtidas",
       stats_seo:"Pontuação SEO", stats_viral:"Pontuação viral", stats_global:"Pontuação global", stats_tags:"Tags",
       stats_summary:"Resumo", stats_scores:"Pontuações", stats_channel:"Canal", stats_subscribers:"Inscritos",
       stats_total_views:"Visualizações totais", stats_videos:"Vídeos",
       stats_click_load:"clique para carregar", stats_na:"—",
       stats_growth:"Crescimento", stats_growth_start:"Rastreamento iniciado hoje — volte em alguns dias para ver a tendência.",
       stats_growth_days:"em {n} dias", stats_locked_title:"Estatísticas Pro",
       qm_open:"Abrir VidSpark", qm_signin:"Entra para desbloquear",
       qm_need_video:"Abre um vídeo do YouTube para ver a análise." },
  de:{ stats_views:"Aufrufe", stats_comments:"Kommentare", stats_likes:"Likes",
       stats_seo:"SEO-Wert", stats_viral:"Viral-Wert", stats_global:"Gesamtwert", stats_tags:"Tags",
       stats_summary:"Übersicht", stats_scores:"Werte", stats_channel:"Kanal", stats_subscribers:"Abonnenten",
       stats_total_views:"Gesamtaufrufe", stats_videos:"Videos",
       stats_click_load:"zum Laden klicken", stats_na:"—",
       stats_growth:"Wachstum", stats_growth_start:"Tracking heute gestartet — schau in ein paar Tagen vorbei, um den Trend zu sehen.",
       stats_growth_days:"über {n} Tage", stats_locked_title:"Pro-Statistiken",
       qm_open:"VidSpark öffnen", qm_signin:"Zum Freischalten anmelden",
       qm_need_video:"Öffne ein YouTube-Video, um die Analyse zu sehen." },
  ko:{ stats_views:"조회수", stats_comments:"댓글", stats_likes:"좋아요",
       stats_seo:"SEO 점수", stats_viral:"바이럴 점수", stats_global:"종합 점수", stats_tags:"태그",
       stats_summary:"요약", stats_scores:"점수", stats_channel:"채널", stats_subscribers:"구독자",
       stats_total_views:"총 조회수", stats_videos:"동영상",
       stats_click_load:"클릭하여 불러오기", stats_na:"—",
       stats_growth:"성장", stats_growth_start:"오늘부터 추적을 시작했습니다 — 며칠 후 다시 확인해 추이를 보세요.",
       stats_growth_days:"{n}일 동안", stats_locked_title:"Pro 통계",
       qm_open:"VidSpark 열기", qm_signin:"잠금 해제하려면 로그인",
       qm_need_video:"분석을 보려면 YouTube 동영상을 여세요." },
  tr:{ stats_views:"Görüntülenme", stats_comments:"Yorumlar", stats_likes:"Beğeni",
       stats_seo:"SEO Puanı", stats_viral:"Viral Puan", stats_global:"Genel Puan", stats_tags:"Etiketler",
       stats_summary:"Özet", stats_scores:"Puanlar", stats_channel:"Kanal", stats_subscribers:"Abone",
       stats_total_views:"Toplam Görüntülenme", stats_videos:"Videolar",
       stats_click_load:"yüklemek için tıklayın", stats_na:"—",
       stats_growth:"Büyüme", stats_growth_start:"Takip bugün başladı — eğilimi görmek için birkaç gün sonra tekrar bak.",
       stats_growth_days:"{n} günde", stats_locked_title:"Pro İstatistikleri",
       qm_open:"VidSpark'ı Aç", qm_signin:"Kilidi açmak için giriş yap",
       qm_need_video:"Analizi görmek için bir YouTube videosu aç." },
  it:{ stats_views:"Visualizzazioni", stats_comments:"Commenti", stats_likes:"Mi piace",
       stats_seo:"Punteggio SEO", stats_viral:"Punteggio virale", stats_global:"Punteggio globale", stats_tags:"Tag",
       stats_summary:"Riepilogo", stats_scores:"Punteggi", stats_channel:"Canale", stats_subscribers:"Iscritti",
       stats_total_views:"Visualizzazioni totali", stats_videos:"Video",
       stats_click_load:"clic per caricare", stats_na:"—",
       stats_growth:"Crescita", stats_growth_start:"Monitoraggio iniziato oggi — torna tra qualche giorno per vedere l'andamento.",
       stats_growth_days:"in {n} giorni", stats_locked_title:"Statistiche Pro",
       qm_open:"Apri VidSpark", qm_signin:"Accedi per sbloccare",
       qm_need_video:"Apri un video di YouTube per vedere l'analisi." },
  nl:{ stats_views:"Weergaven", stats_comments:"Reacties", stats_likes:"Vind-ik-leuks",
       stats_seo:"SEO-score", stats_viral:"Viral-score", stats_global:"Totaalscore", stats_tags:"Tags",
       stats_summary:"Overzicht", stats_scores:"Scores", stats_channel:"Kanaal", stats_subscribers:"Abonnees",
       stats_total_views:"Totaal weergaven", stats_videos:"Video's",
       stats_click_load:"klik om te laden", stats_na:"—",
       stats_growth:"Groei", stats_growth_start:"Tracking vandaag gestart — kom over een paar dagen terug om de trend te zien.",
       stats_growth_days:"over {n} dagen", stats_locked_title:"Pro-statistieken",
       qm_open:"VidSpark openen", qm_signin:"Log in om te ontgrendelen",
       qm_need_video:"Open een YouTube-video om de analyse te zien." }
};
function ST(key){
  const L = SHELL_STRINGS[currentLanguage] || SHELL_STRINGS.en;
  return L[key] !== undefined ? L[key] : (SHELL_STRINGS.en[key] || key);
}

/* ══════════════════════════════════════════════════════════════
   UTILITAIRES
══════════════════════════════════════════════════════════════ */
function esc(s){ if(!s)return""; return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function showToast(msg){
  let el=document.getElementById("echo-toast");
  if(!el){
    el=document.createElement("div"); el.id="echo-toast";
    el.setAttribute("role","status"); el.setAttribute("aria-live","polite");
    document.body.appendChild(el);
  }
  el.textContent=errText(msg);el.classList.add("visible");
  setTimeout(()=>el.classList.remove("visible"),2200);
}

/* n peut valoir null : une mesure absente (miniature non lisible) reste neutre,
   elle ne doit pas s'afficher en rouge comme un mauvais score. */
function scoreColor(n){ return n==null?"#8b8b96":n>=80?"#22c55e":n>=60?"#eab308":"#ef4444"; }
function fmtScore(n){ return n==null?"—":n; }

function spinnerHTML(msg){
  /* role=status + aria-live : un lecteur d'écran annonce le chargement, qui était
     jusqu'ici entièrement muet. */
  return `<div class="echo-ai-loader" role="status" aria-live="polite">
    <div class="echo-ai-loader-ring"></div>
    <div class="echo-ai-loader-text">
      <span class="echo-ai-loader-title echo-ai-loader-dots">${esc(msg||T("loading"))}</span>
    </div>
  </div>`;
}

/* Les messages d'erreur venant du service worker sont des CLÉS i18n (il n'a pas
   accès au dictionnaire) : on les traduit ici, quel que soit le chemin
   d'affichage. Un message déjà rédigé passe inchangé. */
function errText(msg){
  return (typeof msg==="string" && I18N.en[msg]!==undefined) ? T(msg) : msg;
}
function errHTML(msg){
  return `<div class="echo-error" role="alert">⚠ ${esc(errText(msg))}</div>`;
}

function setContent(id, html){
  const el=document.getElementById(id);
  if(!el) return;
  el.innerHTML=html;
  el.classList.remove("echo-reveal");
  void el.offsetWidth; // force reflow so the animation replays every time
  el.classList.add("echo-reveal");
}

function downloadText(filename, text, mime){
  const blob=new Blob([text],{type:(mime||"text/plain")+";charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=filename; document.body.appendChild(a); a.click();
  a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function progressBar(pct, color){
  return `<div class="echo-progress"><div class="echo-progress-fill" style="width:${Math.min(100,pct)}%;background:${color||"#7c6dfa"}"></div></div>`;
}

/* ══════════════════════════════════════════════════════════════
   DONNÉES VIDÉO
══════════════════════════════════════════════════════════════ */
function extractVideoId(){
  const url=window.location.href;
  const w=url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if(w)return w[1];
  const s=url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if(s)return s[1];
  return null;
}
function isVideoPage(){ return /watch\?v=|\/shorts\//.test(window.location.href); }

/* Type de page YouTube courante — utilisé par le Quick Menu pour adapter son contenu
   (ex: pas de scores vidéo sur une page chaîne). N'affecte PAS isVideoPage()/createPanel(),
   qui gardent leur logique actuelle (watch/shorts uniquement) pour éviter toute régression. */
function getPageType(){
  const p = window.location.pathname;
  if(/\/shorts\//.test(p)) return 'SHORT';
  if(/^\/watch/.test(p) && /[?&]v=/.test(window.location.search)) return 'VIDEO';
  if(/^\/channel\/|^\/@|^\/user\//.test(p)) return 'CHANNEL';
  if(/^\/results/.test(p)) return 'SEARCH';
  return 'OTHER';
}

/* Nombre de "j'aime" affiché par YouTube — lu directement sur le bouton, jamais estimé.
   Absent/illisible → null (jamais de valeur inventée, voir règle du panneau Coach). */
function readLikeCount(){
  const el = document.querySelector('like-button-view-model button, #segmented-like-button button');
  const raw = el?.getAttribute('aria-label') || el?.textContent || '';
  const m = raw.match(/[\d][\d\s.,]*[kKmM]?/);
  return m ? m[0].trim() : null;
}

/* Nombre de commentaires — lu dans l'en-tête de la section commentaires. */
function readCommentCount(){
  const el = document.querySelector('ytd-comments-header-renderer #count yt-formatted-string, ytd-comments-header-renderer #count .count-text');
  const raw = el?.textContent || '';
  const m = raw.match(/[\d][\d\s.,]*[kKmM]?/);
  return m ? m[0].trim() : null;
}

/* Tags de la vidéo — réellement présents dans les meta tags YouTube (pas une invention). */
function readVideoTags(){
  const content = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
  return content ? content.split(',').map(t=>t.trim()).filter(Boolean) : [];
}

/* Abonnés de la chaîne — affiché directement sous le titre de la vidéo, lu tel quel. */
function readSubscriberCount(){
  const el = document.querySelector('#owner-sub-count, ytd-video-owner-renderer #owner-sub-count');
  const raw = el?.textContent || '';
  const m = raw.match(/[\d][\d\s.,]*[kKmM]?/);
  return m ? m[0].trim() : null;
}

function getVideoData(){
  const videoId=extractVideoId();
  if(!videoId)return null;
  const isShort=/\/shorts\//.test(window.location.href);
  const title=document.title.replace(" - YouTube","").trim();
  const views=document.querySelector("#info span")?.innerText||document.querySelector(".view-count")?.innerText||"—";
  const descEl=document.querySelector("#description-inline-expander,#description ytd-text-inline-expander");
  const description=descEl?.innerText?.slice(0,600)||"";
  const descLength=descEl?.innerText?.length||0;
  const thumb=`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return {videoId,title,views,description,descLength,thumb,isShort};
}

/**
 * Extraire le Channel ID YouTube de la page actuelle
 */
function extractYouTubeChannelId(){
  try {
    // Chercher dans les meta tags
    const metaTags = document.querySelectorAll('meta[property], meta[name]');
    for (let tag of metaTags) {
      const property = tag.getAttribute('property') || tag.getAttribute('name');
      if (property?.includes('channelId') || property?.includes('channel_id')) {
        return tag.getAttribute('content');
      }
    }

    // Chercher dans le HTML
    const match = document.documentElement.innerHTML.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);
    if (match) return match[1];

    // Chercher dans l'URL (channel/UCxxxxx)
    const urlMatch = window.location.href.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
    if (urlMatch) return urlMatch[1];

    return null;
  } catch (err) {
    console.error('[VidSpark] Error extracting channel ID:', err);
    return null;
  }
}

/* Détecter la chaîne du COMPTE CONNECTÉ (pas celle de la vidéo en cours).
   Renvoie {id, name} ou null. */
async function getMyChannelId(){
  // Méthode 1 : page /account (authentifiée automatiquement par les cookies)
  try {
    const res = await fetch('https://www.youtube.com/account', { credentials: 'include' });
    const html = await res.text();
    const idMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/)
                 || html.match(/"externalId":"(UC[a-zA-Z0-9_-]{22})"/)
                 || html.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
    if (idMatch) {
      const nameMatch = html.match(/"accountName":\{"simpleText":"([^"]+)"/)
                     || html.match(/"channelTitle":"([^"]+)"/)
                     || html.match(/"title":"([^"]+)","navigationEndpoint"/);
      return { id: idMatch[1], name: nameMatch ? nameMatch[1] : idMatch[1] };
    }
  } catch (e) { console.warn('[VidSpark] /account détection échouée:', e.message); }

  // Méthode 2 : API interne account_menu (repli)
  try {
    const html = document.documentElement.innerHTML;
    const key = (html.match(/"INNERTUBE_API_KEY":"([^"]+)"/) || [])[1];
    const ver = (html.match(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/) || [])[1] || '2.20240101.00.00';
    if (!key) return null;
    const res = await fetch('https://www.youtube.com/youtubei/v1/account/account_menu?key=' + key, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: ver, hl: 'fr', gl: 'US' } } })
    });
    const s = JSON.stringify(await res.json());
    const idMatch = s.match(/"(?:externalChannelId|channelId|browseId)":"(UC[a-zA-Z0-9_-]{22})"/);
    if (!idMatch) return null;
    const nameMatch = s.match(/"accountName":\{"simpleText":"([^"]+)"/);
    return { id: idMatch[1], name: nameMatch ? nameMatch[1] : idMatch[1] };
  } catch (e) {
    console.warn('[VidSpark] getMyChannelId échoué:', e.message);
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════
   CALCULS SEO
══════════════════════════════════════════════════════════════ */
function computeSEOScore(title,descLength){
  let s=30;
  if(title.length>=55&&title.length<=70)s+=18; else if(title.length>=45&&title.length<=75)s+=12; else if(title.length>=30)s+=6;
  if(/\d/.test(title))s+=8;
  if(/[?!]/.test(title))s+=5;
  if(descLength>=800)s+=15; else if(descLength>=500)s+=10; else if(descLength>=200)s+=5;
  const pw=["amazing","best","top","ultimate","secret","viral","free","how to","gratuit","incroyable","comment","pourquoi","مذهل","الأفضل","رائع","ترند","guide","tuto","complet"];
  let pwc=0; pw.forEach(w=>{if(title.toLowerCase().includes(w))pwc++;});
  s+=Math.min(pwc*4,12);
  const hasHook=/^(comment|pourquoi|why|how|what|كيف|لماذا|\d)/i.test(title)||/[?]/.test(title);
  if(hasHook)s+=5;
  if(title.length<20)s-=15; if(title.length>100)s-=10;
  return Math.round(Math.max(0,Math.min(s,100)));
}

function computeSEOPotential(title,descLength){
  /* Score potentiel si toutes les fixes étaient appliquées */
  let s=computeSEOScore(title,descLength);
  if(title.length<45||title.length>75)s+=18;
  if(!/\d/.test(title))s+=8;
  if(!/[?!]/.test(title))s+=5;
  if(descLength<500)s+=10;
  const pw=["amazing","best","top","ultimate","secret","viral","free","gratuit","incroyable"];
  if(!pw.some(w=>title.toLowerCase().includes(w)))s+=8;
  const hasHook=/^(comment|pourquoi|why|how|\d)/i.test(title)||/[?]/.test(title);
  if(!hasHook)s+=5;
  return Math.round(Math.max(0,Math.min(s,100)));
}

function computeViralScore(title,descLength,seo){
  const hasHook=/^(comment|pourquoi|why|how|what|كيف|لماذا|\d)/i.test(title)||/[?]/.test(title);
  const hasNum=/\d/.test(title);
  const hasEmot=/amazing|best|free|secret|viral|gratuit|incroyable|مذهل|الأفضل|ultime|ultimate/.test(title.toLowerCase());
  const lenOk=title.length>=45&&title.length<=75;
  let v=seo*0.45;
  if(hasHook)v+=18; if(hasNum)v+=10; if(hasEmot)v+=12; if(lenOk)v+=5;
  if(descLength>=500)v+=8; if(descLength>=300)v+=5;
  return Math.round(Math.max(0,Math.min(v,100)));
}

function computeViralPotential(title,descLength,seo){
  let v=computeViralScore(title,descLength,seo);
  const hasHook=/^(comment|pourquoi|why|how|\d)/i.test(title)||/[?]/.test(title);
  const hasNum=/\d/.test(title);
  const hasEmot=/amazing|best|free|secret|viral|gratuit|incroyable/.test(title.toLowerCase());
  if(!hasHook)v+=18; if(!hasNum)v+=10; if(!hasEmot)v+=12;
  if(descLength<500)v+=8;
  return Math.round(Math.max(0,Math.min(v,100)));
}

/* ══════════════════════════════════════════════════════════════
   🖼️ ANALYSE RÉELLE DE LA MINIATURE — pixels, 100 % local
   ──────────────────────────────────────────────────────────────
   Le score de miniature était auparavant dérivé d'un hash du videoId :
   déterministe mais totalement fictif, alors qu'il pèse 25 % du score global
   affiché en grand par le Coach et qu'il alimente le CTR estimé.
   Il est désormais MESURÉ sur l'image réelle : luminance, contraste, richesse
   chromatique (Hasler & Süsstrunk), gradient (netteté), densité de contours
   (encombrement), teintes de peau (présence humaine probable), résolution.
   Tout est calculé dans un canvas hors écran, sans aucun appel réseau vers
   nos serveurs — seule l'image publique i.ytimg.com est lue.
   Si l'image n'est pas lisible, le score vaut null : on l'exclut du score
   global au lieu d'inventer une valeur.
══════════════════════════════════════════════════════════════ */
const THUMB_ANALYSIS = new Map();   // videoId → mesures (ou null si non mesurable)

function measureThumbPixels(img){
  const W=128, H=72, n=W*H;
  const cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  const ctx=cv.getContext("2d",{willReadFrequently:true});
  ctx.drawImage(img,0,0,W,H);
  const d=ctx.getImageData(0,0,W,H).data;   // SecurityError possible → géré par l'appelant

  const lum=new Float32Array(n);
  let sum=0, skin=0, rgSum=0, rgSq=0, ybSum=0, ybSq=0;
  for(let i=0,p=0;p<n;i+=4,p++){
    const r=d[i], g=d[i+1], b=d[i+2];
    const l=0.2126*r+0.7152*g+0.0722*b;
    lum[p]=l; sum+=l;
    /* Opposants couleur : mesure standard de « colorfulness » */
    const rg=r-g, yb=0.5*(r+g)-b;
    rgSum+=rg; rgSq+=rg*rg; ybSum+=yb; ybSq+=yb*yb;
    /* Teinte de peau en YCbCr — heuristique classique, indice de présence humaine */
    const cb=128-0.168736*r-0.331264*g+0.5*b;
    const cr=128+0.5*r-0.418688*g-0.081312*b;
    if(l>40 && cb>=77 && cb<=127 && cr>=133 && cr<=173) skin++;
  }
  const bright=sum/n;
  let varSum=0; for(let p=0;p<n;p++){ const dv=lum[p]-bright; varSum+=dv*dv; }
  const contrast=Math.sqrt(varSum/n);
  const rgM=rgSum/n, ybM=ybSum/n;
  const colorful=Math.sqrt(Math.max(0,rgSq/n-rgM*rgM)+Math.max(0,ybSq/n-ybM*ybM))+0.3*Math.hypot(rgM,ybM);

  /* Gradient de luminance : netteté moyenne + part de pixels très contrastés
     (proxy d'encombrement : texte surchargé, montage trop dense). */
  let gradSum=0, strong=0;
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
    const i=y*W+x;
    const m=Math.hypot(lum[i+1]-lum[i-1], lum[i+W]-lum[i-W]);
    gradSum+=m;
    if(m>48) strong++;
  }
  const inner=(W-2)*(H-2);
  return {
    w:img.naturalWidth, h:img.naturalHeight,
    bright, contrast,
    colorful,
    sharp:gradSum/inner,
    clutter:(strong/inner)*100,
    skinRatio:(skin/n)*100
  };
}

/* Barème documenté : chaque sous-score confronte une mesure réelle à une plage
   cible (miniature lumineuse, contrastée, colorée, nette, lisible, incarnée).
   C'est un barème d'optimisation, pas une prédiction de performance. */
function scoreThumbMetrics(m){
  const band=(v,lo,hi,soft)=>{
    if(v>=lo&&v<=hi) return 100;
    const dist=v<lo?lo-v:v-hi;
    return Math.max(0,Math.round(100-(dist/soft)*100));
  };
  const up=(v,min,max)=>Math.max(0,Math.min(100,Math.round((v-min)/(max-min)*100)));
  /* Plages calibrées sur des miniatures réelles mesurées avec ce même code
     (densité de contours observée entre 14 % et 40 % : une photo détaillée n'est
     pas une miniature surchargée, seuls les extrêmes sont pénalisés). */
  const sub={
    light:    band(m.bright,95,175,90),
    contrast: up(m.contrast,18,62),
    color:    up(m.colorful,12,55),
    sharp:    up(m.sharp,6,26),
    space:    band(m.clutter,6,34,22),
    human:    m.skinRatio>=6?100:up(m.skinRatio,0.8,6),
    res:      m.w>=1280?100:m.w>=640?70:40
  };
  const W={light:.14,contrast:.20,color:.16,sharp:.14,space:.12,human:.12,res:.12};
  let s=0; for(const k in W) s+=sub[k]*W[k];
  return {score:Math.max(5,Math.min(99,Math.round(s))), sub};
}

/* Ordre d'affichage des mesures + clé i18n de chaque libellé. */
const THUMB_METRICS=[
  {k:"contrast",i18n:"th_m_contrast",color:"#f7941d"},
  {k:"light",   i18n:"th_m_light",   color:"#eab308"},
  {k:"color",   i18n:"th_m_color",   color:"#ec4899"},
  {k:"sharp",   i18n:"th_m_sharp",   color:"#3b82f6"},
  {k:"space",   i18n:"th_m_space",   color:"#7c6dfa"},
  {k:"human",   i18n:"th_m_human",   color:"#22c55e"},
  {k:"res",     i18n:"th_m_res",     color:"#14b8a6"}
];

function loadThumbImage(videoId){
  /* maxres d'abord (vraie résolution), hqdefault en repli. YouTube renvoie
     parfois une vignette grise 120×90 quand maxres n'existe pas → on la rejette. */
  const urls=[`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`];
  return new Promise(resolve=>{
    let i=0;
    const tryNext=()=>{
      if(i>=urls.length) return resolve(null);
      const img=new Image();
      img.crossOrigin="anonymous";           // indispensable pour lire les pixels
      img.onload =()=>{ if(img.naturalWidth<200){ i++; return tryNext(); } resolve(img); };
      img.onerror=()=>{ i++; tryNext(); };
      img.src=urls[i];
    };
    tryNext();
  });
}

async function ensureThumbAnalysis(videoId){
  if(!videoId) return null;
  if(THUMB_ANALYSIS.has(videoId)) return THUMB_ANALYSIS.get(videoId);
  let res=null;
  try{
    /* Garde-fou : le panneau attend cette mesure, il ne doit jamais rester bloqué
       si l'image ne répond pas. */
    const img=await Promise.race([
      loadThumbImage(videoId),
      new Promise(r=>setTimeout(()=>r(null),2500))
    ]);
    if(img){
      const m=measureThumbPixels(img);
      res={...m, ...scoreThumbMetrics(m)};
    }
  }catch(e){ res=null; }   // canvas verrouillé / mémoire : « non mesuré » plutôt qu'un faux score
  if(THUMB_ANALYSIS.size>40) THUMB_ANALYSIS.clear();
  THUMB_ANALYSIS.set(videoId,res);
  return res;
}

function thumbAnalysis(videoId){ return THUMB_ANALYSIS.get(videoId)||null; }

/* Faiblesse dominante mesurée : sert de « pourquoi » au Coach et de verdicts
   dans l'onglet Miniature. Renvoie null si l'image est bonne partout. */
function thumbWeakness(videoId){
  const a=thumbAnalysis(videoId);
  if(!a||!a.sub) return null;
  const worst=THUMB_METRICS.map(m=>({k:m.k,v:a.sub[m.k]})).sort((x,y)=>x.v-y.v)[0];
  /* Seuil bas volontairement : accuser une miniature d'être « peu contrastée »
     à 70/100 serait faux. On ne parle que d'un défaut vraiment mesuré. */
  if(!worst||worst.v>=60) return null;
  const key={
    light:    a.bright<95?"th_v_dark":"th_v_washed",
    contrast: "th_v_flat",
    color:    "th_v_dull",
    sharp:    "th_v_soft",
    space:    a.clutter>16?"th_v_busy":"th_v_empty",
    human:    "th_v_noface",
    res:      "th_v_lowres"
  }[worst.k];
  return key?{metric:worst.k,value:worst.v,text:T(key)}:null;
}

function computeThumbScore(videoId){
  /* Score réel mesuré sur les pixels (voir ensureThumbAnalysis).
     null = miniature non mesurable : exclue du score global. */
  const a=thumbAnalysis(videoId);
  return a?a.score:null;
}

function computeThumbPotential(thumbScore){
  /* Déterministe : le Coach affiche ce potentiel en gros et l'anime — une valeur
     aléatoire changeait à chaque rendu et rendait le score incohérent d'un
     affichage à l'autre. La marge est proportionnelle à l'écart au maximum. */
  if(thumbScore==null) return null;
  return Math.min(100, thumbScore + Math.round((92-thumbScore)*0.55));
}

/* Mots-clés absents du titre. La liste localisée (missing_kw_list) contient une
   année figée « 2024 » écrite en dur dans les 14 langues : on la remplace par
   l'année courante au lieu de recommander un mot-clé périmé. */
function missingKeywords(title){
  const y=String(new Date().getFullYear());
  const t=(title||"").toLowerCase();
  return (T("missing_kw_list")||"").split(",")
    .map(w=>w.trim()).filter(Boolean)
    .map(w=>/^\d{4}$/.test(w)?y:w)
    .filter(w=>!t.includes(w.toLowerCase()));
}

/* Barème d'intention de recherche (0-100) des mots-clés recommandés. C'est un
   barème documenté, pas un volume de recherche : la largeur de barre était
   auparavant un Math.random() qui changeait à chaque rendu. */
const KW_INTENT={tuto:88,tutorial:88,"チュートリアル":88,"튜토리얼":88,"教程":88,"درس":88,"урок":88,"eğitim":88,
  guide:82,"guía":82,guia:82,guida:82,anleitung:82,handleiding:82,rehber:82,"ガイド":82,"가이드":82,"指南":82,"دليل":82,"руководство":82,"गाइड":82,"ट्यूटोरियल":88,
  "débutant":78,beginner:78,principiante:78,iniciante:78,"anfänger":78,"başlangıç":78,"初心者":78,"초보자":78,"初学者":78,"مبتدئ":78,"начинающий":78,"शुरुआती":78,
  gratuit:74,free:74,gratis:74,"grátis":74,kostenlos:74,"ücretsiz":74,"無料":74,"무료":74,"免费":74,"مجاني":74,"бесплатно":74,"मुफ्त":74,
  complet:70,complete:70,completo:70,compleet:70,komplett:70,tam:70,"完全":70,"完整":70,"كامل":70,"полный":70,"पूर्ण":70};
function kwIntent(w){ return KW_INTENT[String(w).toLowerCase()] ?? (/^\d{4}$/.test(w)?68:65); }

function computeGlobalScore(seo,viral,thumb){
  /* Miniature non mesurée : on renormalise sur les deux composantes réellement
     mesurées plutôt que de compter un 0 ou une valeur inventée. */
  if(thumb==null) return Math.round((seo*0.4+viral*0.35)/0.75);
  return Math.round(seo*0.4+viral*0.35+thumb*0.25);
}

function computeCTR(seo,viral,thumb){
  /* CTR estimé en % basé sur les scores */
  const base=2.0;
  const bonus=thumb==null
    ? ((seo/100)*3+(viral/100)*2.5)*(7.5/5.5)   // même plage max, sur 2 composantes
    : (seo/100)*3+(viral/100)*2.5+(thumb/100)*2;
  return parseFloat((base+bonus).toFixed(1));
}

function buildChecklist(title,descLength){
  const L=I18N[currentLanguage]||I18N.en;
  const n=title.length, d=descLength;
  const lenOk=n>=45&&n<=75;
  const hasNum=/\d/.test(title);
  const pw2=["amazing","best","top","ultimate","secret","free","gratuit","incroyable","viral","tuto","guide"];
  const hasEm=pw2.some(w=>title.toLowerCase().includes(w));
  const hasHk=/^(comment|pourquoi|why|how|what|\d)/i.test(title)||/[?]/.test(title);
  const descOk=d>=300;
  const hasPunct=/[?!]/.test(title);
  return[
    {key:"len",
     status:lenOk?"ok":"fix",
     label:L.cl_len_label,
     detail:lenOk?L.cl_len_ok(n):(n<45?L.cl_len_short(n):L.cl_len_long(n)),
     impact:lenOk?L.cl_len_impact_ok:L.cl_len_impact_fix(n),
     why:T("cl_len_why"),
     gain:lenOk?null:"+12 "+T("pts_seo"),
     example:lenOk?null:(n<45?`"${title} — ${T("ex_guide")} ${CURRENT_YEAR}"`:`"${title.slice(0,55)}…"`),
     suggestions:!lenOk&&n<45?[T("cl_len_s1"),T("cl_len_s2"),T("cl_len_s3")]:
                 !lenOk&&n>75?[T("cl_len_r1"),T("cl_len_r2"),T("cl_len_r3")]:[],
     weight:20},
    {key:"num",
     status:hasNum?"ok":"fix",
     label:L.cl_num_label,
     detail:hasNum?L.cl_num_ok:L.cl_num_fix,
     impact:hasNum?T("impact_pos_num"):T("impact_neg_num"),
     why:T("cl_num_why"),
     gain:hasNum?null:"+8 "+T("pts_viral"),
     example:!hasNum?`"5 ${title.split(' ').slice(0,4).join(' ')}…"`:null,
     suggestions:!hasNum?[T("cl_num_s1"),T("cl_num_s2"),T("cl_num_s3")]:[],
     weight:15},
    {key:"em",
     status:hasEm?"ok":"fix",
     label:L.cl_em_label,
     detail:hasEm?L.cl_em_ok:L.cl_em_fix,
     impact:hasEm?T("impact_em_ok"):T("impact_em_no"),
     why:T("cl_em_why2"),
     gain:hasEm?null:"+12 "+T("pts_viral"),
     example:!hasEm?`"${T("ex_em")} : ${title.slice(0,40)}…"`:null,
     suggestions:!hasEm?[T("cl_em_s1"),T("cl_em_s2"),T("cl_em_s3"),T("cl_em_s4")]:[],
     weight:15},
    {key:"hk",
     status:hasHk?"ok":"fix",
     label:L.cl_hk_label,
     detail:hasHk?L.cl_hk_ok:L.cl_hk_fix,
     impact:hasHk?T("impact_hook_ok"):T("impact_hook_no"),
     why:T("cl_hk_why2"),
     gain:hasHk?null:"+18 "+T("pts_viral"),
     example:!hasHk?`"${T("ex_hook")} ${title.slice(0,45)}…"`:null,
     suggestions:!hasHk?[T("cl_hk_s1"),T("cl_hk_s2"),T("cl_hk_s3")]:[],
     weight:25},
    {key:"desc",
     status:descOk?"ok":"fix",
     label:L.cl_desc_label,
     detail:descOk?L.cl_desc_ok(d):L.cl_desc_fix(d),
     impact:descOk?T("impact_desc_ok"):T("impact_desc_no"),
     why:T("cl_desc_why"),
     gain:descOk?null:"+10 "+T("pts_seo"),
     example:!descOk?T("ex_desc"):null,
     suggestions:!descOk?[T("cl_desc_s1"),T("cl_desc_s2"),T("cl_desc_s3")]:[],
     weight:25},
    {key:"punct",
     status:hasPunct?"ok":"fix",
     label:L.cl_punct_label||T("cl_punct_label"),
     detail:hasPunct?T("cl_punct_ok"):T("cl_punct_fix"),
     impact:hasPunct?T("cl_punct_ok"):T("cl_punct_fix"),
     why:T("cl_punct_why"),
     gain:hasPunct?null:T("cl_punct_gain"),
     example:!hasPunct?`"${title}?"`:null,
     suggestions:!hasPunct?[T("cl_punct_s1"),T("cl_punct_s2")]:
                 [],
     weight:10}
  ];
}

/* ══════════════════════════════════════════════════════════════
   COMMUNICATION BACKGROUND
══════════════════════════════════════════════════════════════ */
/* Après un rechargement de l'extension, d'anciens content scripts tournent encore
   sur les onglets ouverts mais leur contexte est invalidé → on évite le spam d'erreurs. */
function extAlive(){ try{ return !!(chrome.runtime && chrome.runtime.id); }catch(e){ return false; } }
function sendBG(payload){
  return new Promise((resolve,reject)=>{
    if(!extAlive()){ reject(new Error("err_ctx")); return; }
    try{
      chrome.runtime.sendMessage({type:"ECHORANK_API_REQUEST",payload},r=>{
        if(chrome.runtime.lastError)return reject(new Error(chrome.runtime.lastError.message));
        if(r?.error)return reject(new Error(r.error));
        resolve(r);
      });
    }catch(e){ reject(e); }
  });
}

/* ══════════════════════════════════════════════════════════════
   OUVRIR RAPPORT COMPLET
══════════════════════════════════════════════════════════════ */
async function openFullReport(){
  /* ── Vérification plan ── */
  if(currentPlan==="free"){
    // Rediriger directement au site de pricing (pas de popup)
    window.open("https://vidsparkpro.com/pricing.html","_blank");
    return;
  }
  const data=getVideoData();
  if(!data){showToast(T("error_no_video"));return;}
  data.seoScore    =computeSEOScore(data.title,data.descLength);
  data.seoPotential=computeSEOPotential(data.title,data.descLength);
  data.viralScore  =computeViralScore(data.title,data.descLength,data.seoScore);
  data.viralPotential=computeViralPotential(data.title,data.descLength,data.seoScore);
  /* Le rapport peut être ouvert avant que le panneau n'ait mesuré la miniature
     (deep-link, autre onglet) : on s'assure de la mesure au lieu de retomber sur
     une valeur de remplissage. */
  await ensureThumbAnalysis(data.videoId);
  data.thumbScore  =computeThumbScore(data.videoId);
  data.thumbPotential=computeThumbPotential(data.thumbScore);
  data.globalScore =computeGlobalScore(data.seoScore,data.viralScore,data.thumbScore);
  data.ctrEstimated=computeCTR(data.seoScore,data.viralScore,data.thumbScore);
  data.ctrPotential=computeCTR(data.seoPotential,data.viralPotential,data.thumbScore==null?null:Math.min(100,data.thumbScore+15));
  showReportModal(data);
}

/* ── Modal Premium Gate (utilisateurs Free) ── */
function showPremiumGate(){
  const existing=document.getElementById("echo-premium-gate");
  if(existing)existing.remove();
  const gate=document.createElement("div");
  gate.id="echo-premium-gate";
  gate.innerHTML=`
    <div class="echo-gate-overlay" id="echoGateOverlay">
      <div class="echo-gate-box">
        <div class="echo-gate-icon">🔒</div>
        <div class="echo-gate-title">${T("plan_pro")} Premium</div>
        <div class="echo-gate-msg">${T("upgrade_msg")}</div>
        <div class="echo-gate-features">
          <div class="echo-gate-feat">✨ ${T("gate_feat1")}</div>
          <div class="echo-gate-feat">📊 ${T("gate_feat2")}</div>
          <div class="echo-gate-feat">🎯 ${T("gate_feat3")}</div>
        </div>
        <button class="echo-gate-btn" id="btnGateUpgrade">${T("upgrade_btn")}</button>
        <button class="echo-gate-close" id="btnGateClose">✕ ${T("co_chat_close")}</button>
      </div>
    </div>`;
  document.body.appendChild(gate);
  gate.querySelector("#btnGateClose").addEventListener("click",()=>gate.remove());
  gate.querySelector("#echoGateOverlay").addEventListener("click",e=>{if(e.target.id==="echoGateOverlay")gate.remove();});
  /* Échap ferme la modale premium, comme le rapport complet le fait déjà. */
  const gateEsc=e=>{ if(e.key==="Escape"){ gate.remove(); document.removeEventListener("keydown",gateEsc); } };
  document.addEventListener("keydown",gateEsc);
  gate.querySelector("#btnGateClose")?.addEventListener("click",()=>document.removeEventListener("keydown",gateEsc));
  gate.querySelector("#btnGateUpgrade").addEventListener("click",()=>{
    window.open("https://vidsparkpro.com/pricing.html","_blank");
    gate.remove();
  });
}

/* ── Modal Rapport Premium ── */
function showReportModal(data){
  const existing=document.getElementById("echo-report-modal");
  if(existing)existing.remove();

  const seo=data.seoScore||50;
  const viral=data.viralScore||Math.round(seo*0.65);
  /* null = miniature non mesurable : on l'exclut au lieu de la remplacer par 60.
     Les formules réelles (computeGlobalScore / computeCTR) gèrent déjà ce cas. */
  const thumb=data.thumbScore==null?null:data.thumbScore;
  const glob=data.globalScore||computeGlobalScore(seo,viral,thumb);
  const seoPot=data.seoPotential||Math.min(100,seo+20);
  const viralPot=data.viralPotential||Math.min(100,viral+25);
  const thumbPot=data.thumbPotential!=null?data.thumbPotential:computeThumbPotential(thumb);
  const globPot=thumb==null?Math.round((seoPot*0.4+viralPot*0.35)/0.75)
                           :Math.round(seoPot*0.4+viralPot*0.35+thumbPot*0.25);
  const ctr=data.ctrEstimated||computeCTR(seo,viral,thumb);
  const ctrPot=data.ctrPotential||parseFloat((ctr*1.5).toFixed(1));
  const tLen=(data.title||"").length;
  const dLen=data.descLength||0;
  const sc=scoreColor,gc=scoreColor(glob),ss=scoreColor(seo),sv=scoreColor(viral),st=scoreColor(thumb);
  /* Sous-scores mesurés sur les pixels de la miniature (null si non mesurable) */
  const thumbSub=(thumbAnalysis(data.videoId)||{}).sub||null;

  const chk=[
    {ok:tLen>=45&&tLen<=75, label:T("cl_len_label"), gain:18, fix:`${tLen} ${T("unit_char")} → 55–70`},
    {ok:/\d/.test(data.title||""), label:T("cl_num_label"), gain:8, fix:T("viral_add_num")||"Ajouter un chiffre"},
    {ok:/amazing|best|free|secret|viral|gratuit|incroyable|ultime/.test((data.title||"").toLowerCase()), label:T("cl_em_label"), gain:12, fix:T("viral_add_em")||"Ajouter mot émotionnel"},
    {ok:/^(comment|pourquoi|why|how|\d)/i.test(data.title||"")||/[?]/.test(data.title||""), label:T("cl_hk_label"), gain:18, fix:T("viral_add_hook")||"Ajouter hook CTR"},
    {ok:dLen>=300, label:T("cl_desc_label"), gain:10, fix:`${dLen} ${T("unit_char")} → 500+`},
    {ok:/[?!]/.test(data.title||""), label:T("cl_punct_label"), gain:5, fix:T("act_add_punct")},
  ];
  const okChk=chk.filter(c=>c.ok);
  const fixChk=chk.filter(c=>!c.ok);
  const totGain=fixChk.reduce((a,c)=>a+c.gain,0);
  const keywords=(data.title||"").split(/\s+/).filter(w=>w.length>3);
  const missingKw=missingKeywords(data.title);
  const viralLevel=viral>=70?T("viral_high"):viral>=45?T("viral_medium"):T("viral_low");
  const fakeComp=[
    {title:(data.title||"").slice(0,30)+" — Guide Complet",views:"2.4M",score:78,kw:["guide","complet"],why:T("comp_why1")},
    {title:"5 "+(data.title||"").slice(0,25),views:"890K",score:71,kw:["5","astuces"],why:T("comp_why2")},
    {title:"Comment "+(data.title||"").slice(0,25),views:"340K",score:65,kw:["comment","tuto"],why:T("comp_why3")},
  ];

  const modal=document.createElement("div");
  modal.id="echo-report-modal";
  modal.setAttribute("dir",currentLanguage==="ar"?"rtl":"ltr");

  modal.innerHTML=`
    <div class="erm-overlay" id="ermOverlay">
      <div class="erm-box">

        <!-- ── Header ── -->
        <div class="erm-header">
          <span class="erm-logo">⚡ VidSpark AI</span>
          <span class="erm-title">${T("act_full_report")}</span>
          <div class="erm-actions">
            <button class="erm-act-btn" id="ermPrint" title="${esc(T("report_print"))}" aria-label="${esc(T("report_print"))}">🖨</button>
            <button class="erm-act-btn" id="ermCopy" title="${esc(T("pb_copy"))}" aria-label="${esc(T("pb_copy"))}">📋</button>
            <button class="erm-act-btn danger" id="ermClose" title="${esc(T("co_chat_close"))}" aria-label="${esc(T("co_chat_close"))}">✕</button>
          </div>
        </div>

        <!-- ── Body scrollable ── -->
        <div class="erm-body">

          <!-- Vidéo bar -->
          <div class="erm-videobar">
            <img src="https://i.ytimg.com/vi/${esc(data.videoId)}/hqdefault.jpg" class="erm-thumb" alt="">
            <div class="erm-vinfo">
              <div class="erm-vtitle">${esc(data.title)}</div>
              <div class="erm-vstats">
                <span>👁 ${esc(data.views||"—")}</span>
                <span>📝 ${dLen} car.</span>
                <span>🔤 ${tLen} car.</span>
              </div>
            </div>
          </div>

          <!-- Résumé exécutif -->
          <div class="erm-section">
            <div class="erm-section-title">✦ ${T("report_exec")||"Résumé Exécutif"}</div>
            <div class="erm-scores-row">
              <div class="erm-score-card main">
                <svg viewBox="0 0 60 60" width="56" height="56">
                  <circle cx="30" cy="30" r="24" fill="none" stroke="#222" stroke-width="5"/>
                  <circle cx="30" cy="30" r="24" fill="none" stroke="${gc}" stroke-width="5"
                    stroke-linecap="round" stroke-dasharray="${Math.round(glob*1.507)} 151"
                    stroke-dashoffset="38" transform="rotate(-90 30 30)"/>
                  <text x="30" y="34" text-anchor="middle" font-size="13" font-weight="800" fill="${gc}">${glob}</text>
                </svg>
                <div class="erm-score-label">${T("score_global")}</div>
              </div>
              ${[
                {val:seo, label:T("score_seo"), col:ss},
                {val:viral, label:T("score_viral"), col:sv},
                {val:thumb, label:T("score_thumb"), col:st},
                {val:ctr+"%", label:T("overview_ctr_label"), col:"#7c6dfa"},
              ].map(s=>`<div class="erm-score-card">
                <div class="erm-score-num" style="color:${s.col}">${s.val}</div>
                <div class="erm-score-label">${s.label}</div>
              </div>`).join("")}
            </div>
            <div class="erm-exec-summary">
              <strong>Score ${glob}/100</strong> — ${T("report_vp")} <strong>${viralLevel}</strong>.
              ${fixChk.length>0?`${T("report_fix_pre")} ${fixChk.length} ${T("report_fix_mid")} <strong>${globPot}/100</strong> (+${globPot-glob} ${T("report_pts")}), CTR : <strong>${ctr}% → ${ctrPot}%</strong>.`:`${T("seo_all_ok")}`}
            </div>
            <div class="erm-3cols">
              <div class="erm-col ok">
                <div class="erm-col-title">✓ ${T("viral_factors_pos")}</div>
                ${okChk.map(c=>`<div class="erm-col-item">· ${c.label}</div>`).join("")||`<div class="erm-col-item dim">—</div>`}
              </div>
              <div class="erm-col fix">
                <div class="erm-col-title">⚠ ${T("viral_factors_neg")}</div>
                ${fixChk.map(c=>`<div class="erm-col-item">· ${c.label}</div>`).join("")||`<div class="erm-col-item dim">—</div>`}
              </div>
              <div class="erm-col actions">
                <div class="erm-col-title">🚀 ${T("report_actions")||"Actions"}</div>
                ${fixChk.slice(0,3).map((c,i)=>`<div class="erm-col-item">${i+1}. ${c.fix}</div>`).join("")||`<div class="erm-col-item dim">—</div>`}
              </div>
            </div>
          </div>

          <!-- Analyse SEO -->
          <div class="erm-section">
            <div class="erm-section-title">📊 ${T("seo_tab_analyse")||"Analyse SEO"}</div>
            <div class="erm-2cols">
              <div>
                ${[
                  [T("seo_current")||"Score SEO", seo, 100, ss],
                  [T("seo_potential_label")||"Potentiel", seoPot, 100, "#22c55e"],
                  [T("desc_richness")||"Description", Math.min(100,Math.round(dLen/1000*100)), 100, "#7c6dfa"],
                ].map(([lbl,val,mx,col])=>`<div class="erm-progress-row">
                  <span class="erm-progress-label">${lbl}</span>
                  <div class="erm-progress-bar"><div class="erm-progress-fill" style="width:${Math.round(val/mx*100)}%;background:${col}"></div></div>
                  <span class="erm-progress-val" style="color:${col}">${val}</span>
                </div>`).join("")}
              </div>
              <div class="erm-impact-table-wrap">
                <table class="erm-table">
                  <thead><tr><th>${T("seo_action")||"Action"}</th><th>${T("seo_gain_col")||"Gain"}</th></tr></thead>
                  <tbody>
                    ${fixChk.map(c=>`<tr><td>${esc(c.fix)}</td><td style="color:#22c55e;font-weight:700">+${c.gain}</td></tr>`).join("")}
                    ${fixChk.length>0?`<tr><td><strong>Total</strong></td><td style="color:#22c55e;font-weight:700">+${totGain}</td></tr>`:""}
                  </tbody>
                </table>
              </div>
            </div>
            <div style="margin-top:10px">
              <div class="erm-card-head">${T("seo_keywords")||"Mots-clés"}</div>
              <div class="erm-tags">${keywords.map(w=>`<span class="erm-tag">${esc(w)}</span>`).join("")}</div>
            </div>
          </div>

          <!-- Analyse Miniature -->
          <div class="erm-section">
            <div class="erm-section-title">🖼 ${T("thumb_score")||"Miniature"}</div>
            <div class="erm-2cols">
              <div>
                <img src="https://i.ytimg.com/vi/${esc(data.videoId)}/hqdefault.jpg" class="erm-thumb-preview" alt="">
                <div class="erm-score-pair">
                  <div class="erm-sp-item"><span style="color:${st}">${fmtScore(thumb)}/100</span><span>${T("thumb_current")||"Actuel"}</span></div>
                  <div class="erm-sp-item"><span style="color:#22c55e">${fmtScore(thumbPot)}/100</span><span>${T("thumb_potential")||"Potentiel"}</span></div>
                </div>
              </div>
              <div>
                ${thumbSub
                  ? THUMB_METRICS.map(m=>`<div class="erm-progress-row">
                  <span class="erm-progress-label">${T(m.i18n)}</span>
                  <div class="erm-progress-bar"><div class="erm-progress-fill" style="width:${thumbSub[m.k]}%;background:${m.color}"></div></div>
                  <span class="erm-progress-val" style="color:${m.color}">${thumbSub[m.k]}%</span>
                </div>`).join("")+`<div style="margin-top:6px;font-size:10px;color:#777">${T("th_note")}</div>`
                  : `<div style="font-size:11px;color:#888">${T("th_none")}</div>`}
                <div style="margin-top:8px;font-size:11px;color:#888">
                  ${T("overview_ctr_label")}: <strong style="color:${st}">${parseFloat((ctr*0.6).toFixed(1))}%</strong>
                  → ${T("thumb_potential")}: <strong style="color:#22c55e">${parseFloat((ctrPot*0.6).toFixed(1))}%</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Analyse Virale -->
          <div class="erm-section">
            <div class="erm-section-title">🔥 ${T("viral_score")||"Viral"}</div>
            <div class="erm-2cols">
              <div>
                <div class="erm-big-score-pair">
                  <div><div class="erm-big-score" style="color:${sv}">${viral}</div><div class="erm-big-label">${T("viral_current")||"Actuel"}</div></div>
                  <div class="erm-big-arrow">→</div>
                  <div><div class="erm-big-score" style="color:#22c55e">${viralPot}</div><div class="erm-big-label">${T("viral_potential_label")||"Potentiel"}</div></div>
                  <div class="erm-gain-badge">+${viralPot-viral} pts</div>
                </div>
              </div>
              <div>
                ${chk.filter(c=>c.ok).map(c=>`<div class="erm-factor ok">✓ ${c.label}</div>`).join("")}
                ${fixChk.map(c=>`<div class="erm-factor fix">⚠ ${c.fix}</div>`).join("")}
              </div>
            </div>
          </div>

          <!-- Analyse Concurrentielle -->
          <div class="erm-section">
            <div class="erm-section-title">🏆 ${T("comp_title")||"Concurrence"}</div>
            <div class="erm-tags" style="margin-bottom:10px">
              ${missingKw.map(w=>`<span class="erm-tag missing">${esc(w)}</span>`).join("")}
            </div>
            ${fakeComp.map((c,i)=>`
              <div class="erm-comp-row">
                <span class="erm-comp-num">${i+1}</span>
                <div class="erm-comp-body">
                  <div class="erm-comp-title">${esc(c.title)}</div>
                  <div class="erm-comp-meta">
                    <span>👁 ${c.views}</span>
                    <span style="color:${scoreColor(c.score)}">${c.score}/100</span>
                    <span>${c.kw.join(" · ")}</span>
                  </div>
                  <div class="erm-comp-why">💡 ${c.why}</div>
                </div>
              </div>`).join("")}
          </div>

          <!-- Top 10 Actions -->
          <div class="erm-section">
            <div class="erm-section-title">🚀 ${T("top10_title")}</div>
            <div class="erm-top10">
              ${[...fixChk.map(c=>c.fix),
                T("top10_6")||"Ajouter des timestamps",
                T("top10_7")||"Améliorer la miniature",
                T("top10_8")||"Ajouter un visage expressif",
                T("top10_9")||"Publier 14h–17h",
                T("top10_10")||"Répondre aux 10 premiers commentaires"
              ].slice(0,10).map((a,i)=>`
                <div class="erm-top10-item">
                  <span class="erm-top10-num">${i+1}</span>
                  <span class="erm-top10-text">${esc(a)}</span>
                </div>`).join("")}
            </div>
          </div>

        </div><!-- /erm-body -->
      </div><!-- /erm-box -->
    </div><!-- /overlay -->
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(()=>modal.classList.add("visible"));

  /* Events */
  modal.querySelector("#ermClose").addEventListener("click",()=>{
    modal.classList.remove("visible");
    setTimeout(()=>modal.remove(),300);
  });
  modal.querySelector("#ermOverlay").addEventListener("click",e=>{
    if(e.target.id==="ermOverlay"){modal.classList.remove("visible");setTimeout(()=>modal.remove(),300);}
  });
  modal.querySelector("#ermPrint").addEventListener("click",()=>window.print());
  modal.querySelector("#ermCopy").addEventListener("click",()=>{
    const txt=`VidSpark AI — Rapport
SEO: ${seo}/100 · Viral: ${viral}/100 · Miniature: ${fmtScore(thumb)}/100 · Global: ${glob}/100
${fixChk.map((c,i)=>`${i+1}. ${c.fix}`).join("\n")}`;
    navigator.clipboard.writeText(txt).then(()=>showToast("📋 "+T("copied_title")||"Rapport copié ✓"));
  });
  document.addEventListener("keydown",function escHandler(e){
    if(e.key==="Escape"){modal.classList.remove("visible");setTimeout(()=>modal.remove(),300);document.removeEventListener("keydown",escHandler);}
  });
}

/* ══════════════════════════════════════════════════════════════
   RENDU DES ONGLETS
══════════════════════════════════════════════════════════════ */

/* ─── OVERVIEW ─────────────────────────────────────────────── */
function fmtNum(n){ n=+n||0; if(n>=1e6) return (n/1e6).toFixed(1).replace('.0','')+'M'; if(n>=1e3) return (n/1e3).toFixed(1).replace('.0','')+'K'; return ''+n; }

function renderOverview(data,scores,checklist){
  const sc=scoreColor(scores.seo);
  const vc=scoreColor(scores.viral);
  const tc=scoreColor(scores.thumb);
  const gc=scoreColor(scores.global||computeGlobalScore(scores.seo,scores.viral,scores.thumb));
  const global=scores.global||computeGlobalScore(scores.seo,scores.viral,scores.thumb);
  const ctr=scores.ctr||computeCTR(scores.seo,scores.viral,scores.thumb);
  const okCount=checklist.filter(c=>c.status==="ok").length;
  const fixCount=checklist.filter(c=>c.status==="fix").length;
  const totalGain=checklist.filter(c=>c.status==="fix"&&c.gain).map(c=>parseInt(c.gain)||0).reduce((a,b)=>a+b,0);

  return `
    <div class="echo-card">
      <div class="echo-card-head">⚡ ${T("au_section")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_audit"))}</div>
      <button class="echo-action-btn purple" id="btnFullAudit">⚡ ${T("au_run")}</button>
      <div id="card-audit1-result"></div>
    </div>
    <!-- SCORE GLOBAL -->
    <div class="echo-global-score-wrap">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle cx="40" cy="40" r="32" fill="none" stroke="#1a1a1a" stroke-width="6"/>
        <circle cx="40" cy="40" r="32" fill="none" stroke="${gc}" stroke-width="6"
          stroke-linecap="round" stroke-dasharray="${Math.round(global*2.01)} 201"
          stroke-dashoffset="50" transform="rotate(-90 40 40)"/>
        <text x="40" y="37" text-anchor="middle" font-size="16" font-weight="800" fill="${gc}">${global}</text>
        <text x="40" y="50" text-anchor="middle" font-size="8" fill="#555">/ 100</text>
      </svg>
      <div class="echo-global-info">
        <div class="echo-global-label">${T("score_global")}</div>
        <div class="echo-global-ctr">${T("overview_ctr_label")} : <span style="color:#7c6dfa;font-weight:700">${ctr}%</span></div>
        ${fixCount>0?`<div class="echo-global-gain">🚀 ${T("overview_gain_label")} : +${totalGain} pts</div>`:""}
      </div>
    </div>

    <div class="echo-scores-row">
      <div class="echo-score-pill" style="border-color:${sc}">
        <div class="echo-score-num" style="color:${sc}">${scores.seo}</div>
        <div class="echo-score-pill-label">${T("score_seo")}</div>
        ${scores.seoPot&&scores.seoPot>scores.seo?`<div class="echo-score-pot" style="color:#22c55e">↑${scores.seoPot}</div>`:""}
      </div>
      <div class="echo-score-pill" style="border-color:${vc}">
        <div class="echo-score-num" style="color:${vc}">${scores.viral}</div>
        <div class="echo-score-pill-label">${T("score_viral")}</div>
        ${scores.viralPot&&scores.viralPot>scores.viral?`<div class="echo-score-pot" style="color:#22c55e">↑${scores.viralPot}</div>`:""}
      </div>
      <div class="echo-score-pill" style="border-color:${tc}">
        <div class="echo-score-num" style="color:${tc}">${fmtScore(scores.thumb)}</div>
        <div class="echo-score-pill-label">${T("score_thumb")}</div>
      </div>
    </div>

    <div class="echo-stat-row">
      <span class="echo-stat">👁 ${data.views}</span>
      <span class="echo-stat">📝 ${data.descLength} ${T("desc_chars")}</span>
      <span class="echo-stat">🔤 ${data.title.length} ${T("title_chars")}</span>
    </div>

    <div class="echo-card">
      <div class="echo-card-head">${T("checklist_title")} <span class="echo-badge">${okCount}/${checklist.length} ${T("criteria_ok")}</span></div>
      ${checklist.map(c=>`
        <div class="echo-check-row">
          <span class="echo-check-dot ${c.status}"></span>
          <div style="flex:1">
            <span class="echo-check-text">${c.label}</span>
            ${c.gain&&c.status==="fix"?`<span class="echo-gain-pill">${c.gain}</span>`:""}
          </div>
          <span class="echo-check-status ${c.status}">${c.status==="ok"?"✓":"⚠"}</span>
        </div>`).join("")}
    </div>

    <div class="echo-card" id="card-realstats">
      <div class="echo-card-head">📊 ${T("live_stats_title")} <span class="echo-badge" style="background:rgba(255,0,0,.15);color:#ff5252">● LIVE</span></div>
      <button class="echo-action-btn blue" id="btnRealStats">📡 ${T("live_stats_btn")}</button>
    </div>

    <div class="echo-card" id="card-audit">
      <div class="echo-card-head">📈 ${T("audit_title")} <span class="echo-badge" style="background:rgba(255,0,0,.15);color:#ff5252">● LIVE</span></div>
      <button class="echo-action-btn purple" id="btnChannelAudit">📊 ${T("audit_btn")}</button>
    </div>

    <button class="echo-full-report-btn" id="btnFullReport">${T("act_full_report")}</button>
  `;
}

/* ─── SEO TAB — 3 sous-onglets ─────────────────────────────── */
let seoSubTab = "analyse"; // analyse | optimisation | keywords

function renderSEO(data,scores,checklist){
  const okCount=checklist.filter(c=>c.status==="ok").length;
  const fixCount=checklist.filter(c=>c.status==="fix").length;
  const seoPot=scores.seoPot||scores.seo;
  const gain=seoPot-scores.seo;
  const sc=scoreColor(scores.seo);
  const keywords=(data.title||"").split(/\s+/).filter(w=>w.length>3);
  const missingKw=missingKeywords(data.title);
  /* Recommandations tirées de la liste localisée (donc traduites) au lieu d'une
     liste française codée en dur contenant une année périmée. */
  const recommended=missingKw.filter(w=>!keywords.map(k=>k.toLowerCase()).includes(w.toLowerCase()));

  const subTabs=[
    {id:"analyse",  icon:"📊", label:T("seo_tab_analyse")||"Analyse"},
    {id:"optimisation",icon:"🎯",label:T("seo_tab_optim")||"Optimisation"},
    {id:"keywords", icon:"🔑", label:T("seo_tab_kw")||"Mots-clés"},
  ];

  function renderSubContent(){
    if(seoSubTab==="analyse") return `
      <!-- Barre de progression SEO -->
      <div class="echo-seo-progress-bar">
        <div class="echo-seo-pb-scores">
          <div class="echo-seo-pb-item">
            <span class="echo-seo-pb-val" style="color:${sc}">${scores.seo}/100</span>
            <span class="echo-seo-pb-label">${T("seo_current")}</span>
          </div>
          <div class="echo-seo-pb-arrow">→</div>
          <div class="echo-seo-pb-item">
            <span class="echo-seo-pb-val" style="color:#22c55e">${seoPot}/100</span>
            <span class="echo-seo-pb-label">${T("seo_potential_label")}</span>
          </div>
          ${gain>0?`<div class="echo-gain-pill large">+${gain} pts</div>`:""}
        </div>
        <div class="echo-seo-pb-track">
          <div class="echo-seo-pb-fill-cur" style="width:${scores.seo}%"></div>
          <div class="echo-seo-pb-fill-pot" style="width:${seoPot}%;opacity:.35"></div>
        </div>
      </div>

      <!-- Résumé rapide -->
      <div class="echo-seo-summary-row">
        <div class="echo-seo-summary-chip ok">✓ ${okCount} ${T("criteria_ok")}</div>
        <div class="echo-seo-summary-chip fix">⚠ ${fixCount} ${T("seo_tab_issues")||"problèmes"}</div>
      </div>

      <!-- Titre -->
      <div class="echo-card">
        <div class="echo-card-head">${T("seo_title_analysis")}</div>
        <div class="echo-title-preview">"${esc(data.title)}"</div>
        <div style="position:relative;height:6px;background:#222;border-radius:99px;margin:6px 0">
          <div style="position:absolute;height:100%;width:${Math.min(100,data.title.length)}%;background:${sc};border-radius:99px;transition:width .5s"></div>
          <div style="position:absolute;left:45%;top:-3px;width:2px;height:12px;background:#22c55e;border-radius:2px"></div>
          <div style="position:absolute;left:75%;top:-3px;width:2px;height:12px;background:#22c55e;border-radius:2px"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#555">
          <span>0</span><span style="color:#22c55e">45</span><span style="color:#22c55e">75</span><span>100</span>
        </div>
      </div>

      <!-- Checklist compacte (sans why/suggestions) -->
      <div class="echo-card">
        <div class="echo-card-head">${T("checklist_title")}</div>
        ${checklist.map(c=>`
          <div class="echo-check-row">
            <span class="echo-check-dot ${c.status}"></span>
            <div style="flex:1">
              <span class="echo-check-text">${c.label}</span>
              <span class="echo-check-sub">${c.detail}</span>
            </div>
            ${c.gain&&c.status==="fix"?`<span class="echo-gain-pill">${c.gain}</span>`:""}
            <span class="echo-check-status ${c.status}">${c.status==="ok"?"✓":"⚠"}</span>
          </div>`).join("")}
      </div>`;

    if(seoSubTab==="optimisation") return `
      <!-- Score potentiel -->
      <div class="echo-seo-progress-bar">
        <div class="echo-seo-pb-scores">
          <div class="echo-seo-pb-item">
            <span class="echo-seo-pb-val" style="color:${sc}">${scores.seo}</span>
            <span class="echo-seo-pb-label">${T("seo_current")}</span>
          </div>
          <div class="echo-seo-pb-arrow">→</div>
          <div class="echo-seo-pb-item">
            <span class="echo-seo-pb-val" style="color:#22c55e">${seoPot}</span>
            <span class="echo-seo-pb-label">${T("seo_potential_label")}</span>
          </div>
          ${gain>0?`<div class="echo-gain-pill large">+${gain} pts</div>`:""}
        </div>
      </div>

      <!-- Recommandations détaillées -->
      ${checklist.filter(c=>c.status==="fix").map(c=>`
        <div class="echo-check-full fix">
          <div class="echo-check-full-head">
            <span class="echo-check-icon-lg fix">⚠</span>
            <div style="flex:1">
              <div class="echo-check-full-label">${c.label} <span class="echo-gain-pill">${c.gain}</span></div>
              <div class="echo-check-full-detail">${c.detail}</div>
            </div>
          </div>
          <div class="echo-check-impact">${T("seo_impact")} : <span style="color:#eab308">${c.impact}</span></div>
          ${c.why?`<div class="echo-check-why">💡 ${c.why}</div>`:""}
          ${c.example?`<div class="echo-check-example">${T("example_label")} <span class="echo-example-text">${esc(c.example)}</span></div>`:""}
          ${c.suggestions?.length>0?`
            <div class="echo-check-suggestions">
              <div class="echo-suggestions-label">${T("recommendation_label")||T("seo_recommendation")} :</div>
              ${c.suggestions.map(s=>`<div class="echo-suggestion">${esc(s)}</div>`).join("")}
            </div>`:""}
        </div>`).join("")||`
        <div class="echo-card" style="text-align:center;padding:20px;color:#22c55e">✓ ${T("seo_all_ok")||"Tous les critères sont validés !"}</div>`}

      <!-- Suggestions IA -->
      <div class="echo-card" id="card-seo-ai">
        <div class="echo-card-head">${T("seo_suggestions")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span></div>
        <button class="echo-action-btn purple" id="btnSEOReport">✨ ${T("btn_report")}</button>
      </div>`;

    if(seoSubTab==="keywords") return `
      <!-- Mots-clés du titre -->
      <div class="echo-card">
        <div class="echo-card-head">${T("seo_keywords")}</div>
        <div class="echo-tag-cloud">${keywords.map(w=>`
          <div class="echo-kw-tag-full">
            <span class="echo-kw-tag-word">${esc(w)}</span>
            <span class="echo-kw-tag-meta">~</span>
          </div>`).join("")}</div>
      </div>

      <!-- Mots-clés manquants -->
      ${missingKw.length>0?`
      <div class="echo-card">
        <div class="echo-card-head">${T("comp_missing")} <span class="echo-badge echo-badge-red">${missingKw.length}</span></div>
        <div class="echo-tag-cloud">${missingKw.map(w=>`<span class="echo-kw-tag missing">${esc(w)}</span>`).join("")}</div>
        <div style="margin-top:8px;font-size:11px;color:#888">${T("kw_add_hint")}</div>
      </div>`:``}

      <!-- Mots-clés recommandés -->
      <div class="echo-card">
        <div class="echo-card-head">${T("seo_tab_rec_kw")||"Mots-clés recommandés"}</div>
        <div class="echo-kw-table">
          ${recommended.slice(0,6).map(w=>{
            const iv=kwIntent(w);
            const badge=iv>=80?T("impact_very_high"):iv>=70?T("impact_high"):T("impact_medium");
            const cls=iv>=80?"echo-badge-red":iv>=70?"echo-badge-amber":"echo-badge-blue";
            return `
            <div class="echo-kw-row">
              <span class="echo-kw-word">${esc(w)}</span>
              <div class="echo-kw-bars">
                <div class="echo-kw-bar" style="width:${iv}%;background:#7c6dfa"></div>
              </div>
              <span class="echo-kw-impact echo-badge ${cls}">${badge}</span>
            </div>`;}).join("")}
        </div>
      </div>

      <!-- Opportunités SEO -->
      <div class="echo-card">
        <div class="echo-card-head">${T("comp_opportunities")}</div>
        ${[T("comp_opp1"),T("comp_opp2"),T("comp_opp3")].map((o,i)=>`
          <div class="echo-rec-row">
            <span class="echo-rec-num">${i+1}</span>
            <div class="echo-rec-body"><div class="echo-rec-text">${o}</div></div>
          </div>`).join("")}
      </div>`;

    return "";
  }

  return `
    <div class="echo-seo-subtabs" id="seoSubTabs">
      ${subTabs.map(t=>`
        <button class="echo-seo-subtab ${t.id===seoSubTab?"active":""}" data-sub="${t.id}">
          ${t.icon} ${t.label}
        </button>`).join("")}
    </div>
    <div id="seoSubContent">
      ${renderSubContent()}
    </div>
  `;
}

/* ─── THUMBNAIL TAB ─────────────────────────────────────────── */
function renderThumbnail(data,scores){
  const tc=scoreColor(scores.thumb);
  const thumbHD=`https://i.ytimg.com/vi/${data.videoId}/maxresdefault.jpg`;
  /* Mesures réelles de l'image (canvas local) : remplacent 5 barres d'émotion
     tirées au hasard et 4 constats figés qui ne regardaient pas la miniature. */
  const an=thumbAnalysis(data.videoId);
  const sub=an&&an.sub;
  const bars=sub?THUMB_METRICS.map(m=>({name:T(m.i18n),val:sub[m.k],color:m.color})):[];
  const checks=sub?[
    {ok:sub.contrast>=60,label:T("thumb_contrast"),detail:sub.contrast>=60?T("thumb_good_contrast"):T("th_v_flat")},
    {ok:sub.light>=60,   label:T("th_m_light"),    detail:sub.light>=60?T("th_ok"):(an.bright<95?T("th_v_dark"):T("th_v_washed"))},
    {ok:sub.space>=60,   label:T("thumb_text"),    detail:sub.space>=60?T("thumb_good_text"):(an.clutter>16?T("th_v_busy"):T("th_v_empty"))},
    {ok:sub.human>=60,   label:T("thumb_face"),    detail:sub.human>=60?T("th_v_face"):T("th_v_noface")},
    {ok:an.w>=1280,      label:T("format_standard"),detail:an.w>=1280?`${an.w}×${an.h} — ${T("thumb_format")}`:T("th_v_lowres")}
  ]:[];
  return `
    <div class="echo-score-hero">
      <div class="echo-score-hero-num" style="color:${tc}">${fmtScore(scores.thumb)}/100</div>
      <div class="echo-score-hero-label">${T("thumb_score")}</div>
      ${sub?`<div class="echo-thumb-note">${T("th_note")}</div>`:`<div class="echo-thumb-note">${T("th_none")}</div>`}
    </div>
    <div class="echo-card" id="card-thumb-ai">
      <div class="echo-card-head">🎨 ${T("thumb_ai_title")} <span class="echo-badge echo-badge-ai">Vision</span></div>
      <button class="echo-action-btn purple" id="btnThumbAI">🔍 ${T("thumb_ai_btn")}</button>
    </div>
    <div class="echo-card" id="card-thumb-ideas">
      <div class="echo-card-head">🎨 ${T("thumb_ideas_title")||"Générer des concepts de miniature"} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span></div>
      <div style="font-size:12px;color:#888;margin-bottom:8px;">${T("thumb_ideas_intro")||"3 concepts (texte, couleurs, layout, visage) basés sur ton titre, prêts à exécuter."}</div>
      <input id="thumbIdeaNiche" placeholder="${T("thumb_ideas_niche_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;margin-bottom:8px;">
      <button class="echo-action-btn purple" id="btnThumbIdeas">🎨 ${T("thumb_ideas_btn")||"Générer 3 concepts"}</button>
      <div id="card-thumb-ideas-result"></div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">🔗 ${T("pc_section")} <span class="echo-badge echo-badge-ai">Vision</span>${help(T("h_pair"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px;">${T("pc_intro")}</div>
      <button class="echo-action-btn blue" id="btnPairCheck">🔗 ${T("pc_run")}</button>
      <div id="card-pair-result"></div>
    </div>
    ${renderThumbABSection()}
    <div class="echo-card">
      <div class="echo-card-head">${T("thumb_preview")}</div>
      <img src="${data.thumb}" onerror="this.src='${thumbHD}'" class="echo-thumb-full">
      <div class="echo-thumb-actions">
        <a href="${thumbHD}" target="_blank" class="echo-mini-btn">⬇ ${T("thumb_download")}</a>
        <button class="echo-mini-btn" onclick="navigator.clipboard.writeText('${thumbHD}');this.textContent='✓';setTimeout(()=>this.textContent='📋 ${T("thumb_copy_url")}',1500)">📋 ${T("thumb_copy_url")}</button>
      </div>
    </div>
    ${bars.length?`<div class="echo-card">
      <div class="echo-card-head">${T("th_measured")}</div>
      ${bars.map(e=>`
        <div class="echo-emotion-row">
          <span class="echo-emotion-label">${e.name}</span>
          ${progressBar(e.val,e.color)}
          <span class="echo-emotion-val" style="color:${e.color}">${e.val}%</span>
        </div>`).join("")}
    </div>`:""}
    ${checks.length?`<div class="echo-card">
      <div class="echo-card-head">${T("thumb_strengths")} / ${T("thumb_weaknesses")}</div>
      ${checks.map(c=>`
        <div class="echo-check-row">
          <span class="echo-check-dot ${c.ok?"ok":"fix"}"></span>
          <div style="flex:1"><div class="echo-check-text">${c.label}</div><div class="echo-check-sub">${c.detail}</div></div>
        </div>`).join("")}
    </div>`:""}
    <div class="echo-card">
      <div class="echo-card-head">${T("thumb_suggestions")}</div>
      ${[
        {text:T("thumb_rec1"),impact:T("impact_very_high")},
        {text:T("thumb_rec2"),impact:T("impact_high")},
        {text:T("thumb_rec3"),impact:T("impact_high")},
        {text:T("thumb_rec4"),impact:T("impact_medium")},
      ].map((r,i)=>`
        <div class="echo-rec-row">
          <span class="echo-rec-num">${i+1}</span>
          <div class="echo-rec-body">
            <div class="echo-rec-text">${r.text}</div>
            <span class="echo-badge ${r.impact===T("impact_very_high")?"echo-badge-red":r.impact===T("impact_high")?"echo-badge-amber":"echo-badge-blue"}">${r.impact}</span>
          </div>
        </div>`).join("")}
    </div>
  `;
}

/* ─── VIRAL TAB ─────────────────────────────────────────────── */
function renderViral(data,scores){
  const vc=scoreColor(scores.viral);
  const level=scores.viral>=70?T("viral_high"):scores.viral>=45?T("viral_medium"):T("viral_low");
  const levelColor=scores.viral>=70?"#22c55e":scores.viral>=45?"#eab308":"#ef4444";
  const hasHook=/^(comment|pourquoi|why|how|\d)/i.test(data.title)||/[?]/.test(data.title);
  const hasNum=/\d/.test(data.title);
  const descOk=(data.descLength||0)>=300;
  const pw=["amazing","best","top","free","secret","viral","gratuit","incroyable"];
  const hasEm=pw.some(w=>data.title.toLowerCase().includes(w));
  const positifs=[
    {ok:hasHook,text:T("viral_pos_hook")},
    {ok:hasNum,text:T("viral_pos_num")},
    {ok:hasEm,text:T("viral_pos_em")},
    {ok:descOk,text:T("viral_pos_desc")},
    {ok:data.title.length>=45&&data.title.length<=75,text:T("viral_pos_len")},
  ].filter(f=>f.ok);
  const negatifs=[
    {ok:hasHook,text:T("viral_neg_hook")},
    {ok:hasNum,text:T("viral_neg_num")},
    {ok:hasEm,text:T("viral_neg_em")},
    {ok:descOk,text:T("viral_neg_desc_tpl").replace("N",data.descLength)},
    {ok:data.title.length>=45&&data.title.length<=75,text:(data.title.length<45?T("viral_neg_len_short"):T("viral_neg_len_long"))+" ("+data.title.length+" car.)"},
  ].filter(f=>!f.ok);
  return `
    <div class="echo-score-hero">
      <div class="echo-score-hero-num" style="color:${vc}">${scores.viral}/100</div>
      <div class="echo-score-hero-label">${T("viral_score")}</div>
      <div class="echo-viral-level" style="background:${levelColor}22;color:${levelColor};border:1px solid ${levelColor}">${level}</div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">${T("viral_probability")}</div>
      <div class="echo-progress-wrap">
        <div class="echo-progress-label-row"><span>${T("viral_low")}</span><span>${T("viral_medium")}</span><span>${T("viral_high")}</span></div>
        ${progressBar(scores.viral,vc)}
      </div>
    </div>
    ${positifs.length>0?`
    <div class="echo-card">
      <div class="echo-card-head">${T("viral_factors_pos")}</div>
      ${positifs.map(f=>`<div class="echo-check-row"><span class="echo-check-dot ok"></span><span class="echo-check-text">${f.text}</span><span class="echo-check-status ok">✓</span></div>`).join("")}
    </div>`:""}
    ${negatifs.length>0?`
    <div class="echo-card">
      <div class="echo-card-head">${T("viral_factors_neg")}</div>
      ${negatifs.map(f=>`<div class="echo-check-row"><span class="echo-check-dot fix"></span><span class="echo-check-text">${f.text}</span><span class="echo-check-status fix">⚠</span></div>`).join("")}
    </div>`:""}
    <div class="echo-card">
      <div class="echo-card-head">${T("viral_tips")}</div>
      ${[
        {t:T("viral_tip1"),i:T("impact_high")},
        {t:T("viral_tip2"),i:T("impact_very_high")},
        {t:T("viral_tip3"),i:T("impact_medium")},
        {t:T("viral_tip4"),i:T("impact_high")},
      ].map((r,i)=>`
        <div class="echo-rec-row">
          <span class="echo-rec-num">${i+1}</span>
          <div class="echo-rec-body">
            <div class="echo-rec-text">${r.t}</div>
            <span class="echo-badge ${r.i===T("impact_very_high")?"echo-badge-red":r.i===T("impact_high")?"echo-badge-amber":"echo-badge-blue"}">${r.i}</span>
          </div>
        </div>`).join("")}
    </div>
    <div class="echo-card">
      <div class="echo-card-head">${T("viral_potential_title")}</div>
      <div class="echo-potential-row">
        <div class="echo-potential-block">
          <div class="echo-potential-val" style="color:${vc}">${scores.viral}</div>
          <div class="echo-potential-label">${T("viral_current")}</div>
        </div>
        <div class="echo-potential-arrow">→</div>
        <div class="echo-potential-block">
          <div class="echo-potential-val" style="color:#22c55e">${scores.viralPot||scores.viral}</div>
          <div class="echo-potential-label">${T("viral_potential_label")}</div>
        </div>
        <div class="echo-potential-gain">+${(scores.viralPot||scores.viral)-scores.viral} pts</div>
      </div>
      <div class="echo-potential-fixes">
        ${negatifs.slice(0,3).map(f=>`<div class="echo-fix-item">✓ ${f.text}</div>`).join("")}
      </div>
    </div>
    <div class="echo-card" id="card-viral-ai">
      <div class="echo-card-head">${T("viral_prediction")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span></div>
      <button class="echo-action-btn purple" id="btnViralAI">${T("btn_viral_ai")}</button>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">🪝 ${T("hook_title")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_hook"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px;">${T("hook_intro")}</div>
      <textarea id="hookScript" rows="4" placeholder="${T("hook_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;resize:vertical;margin-bottom:8px;"></textarea>
      <button class="echo-action-btn blue" id="btnHookAnalyze">🪝 ${T("hook_run")}</button>
      <div id="card-hook-result"></div>
    </div>
  `;
}

/* ─── COMPETITOR TAB ────────────────────────────────────────── */
function renderCompetitor(data,scores){
  const keywords=(data.title||"").split(/\s+/).filter(w=>w.length>3);
  const missing=missingKeywords(data.title);
  const __c = `
    <div class="echo-card" id="card-real-comp">
      <div class="echo-card-head">🏆 ${T("real_comp_title")} <span class="echo-badge" style="background:rgba(255,0,0,.15);color:#ff5252">● LIVE</span></div>
      <button class="echo-action-btn blue" id="btnRealComp">📡 ${T("real_comp_btn")}</button>
      <div id="realCompResults"></div>
    </div>
    <div class="echo-card" id="card-keywords">
      <div class="echo-card-head">🔑 ${T("keywords_title")}</div>
      <div style="display:flex;gap:6px;margin-bottom:6px;">
        <input id="kwInput" placeholder="${T("keywords_ph")}" style="flex:1;padding:8px;border-radius:8px;border:1px solid #2a2a35;background:#0f0f1a;color:#fff;font-size:12px;box-sizing:border-box;">
        <button class="echo-action-btn blue" id="btnKeywords" style="white-space:nowrap;">🔍</button>
      </div>
      <div id="kwResults"></div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">${T("comp_position")}</div>
      <div class="echo-comp-scores">
        <div class="echo-comp-score"><span style="color:${scoreColor(scores.seo)}">${scores.seo}/100</span><span>${T("score_seo")}</span></div>
        <div class="echo-comp-score"><span style="color:${scoreColor(scores.viral)}">${scores.viral}/100</span><span>${T("score_viral")}</span></div>
        <div class="echo-comp-score"><span style="color:${scoreColor(scores.thumb)}">${fmtScore(scores.thumb)}/100</span><span>${T("score_thumb")}</span></div>
      </div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">${T("comp_keywords")}</div>
      <div class="echo-tag-cloud">${keywords.map(w=>`<span class="echo-kw-tag">${esc(w)}</span>`).join("")}</div>
    </div>
    <div class="echo-card" id="card-missing-kw">
      <div class="echo-card-head">🔑 ${T("comp_missing")} <span class="echo-badge" style="background:rgba(255,0,0,.15);color:#ff5252">● LIVE</span></div>
      <div id="missingKwBody" style="color:#888;font-size:12px;">${T("spin_kw")}</div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">${T("comp_opportunities")}</div>
      ${[
        T("comp_opp1"),
        T("comp_opp2"),
        T("comp_opp3"),
        T("comp_opp4"),
      ].map((o,i)=>`
        <div class="echo-rec-row">
          <span class="echo-rec-num">${i+1}</span>
          <div class="echo-rec-body"><div class="echo-rec-text">${o}</div></div>
        </div>`).join("")}
    </div>
  `;
  return __c;
}

/* Enveloppe une fonctionnalité Pro dans un teaser FLOUTÉ + cadenas (utilisateurs Free) */
function lockedFeature(html, label){
  return `
    <div class="echo-locked">
      <div class="echo-locked-blur">${html}</div>
      <div class="echo-locked-overlay">
        <div class="echo-locked-icon">🔒</div>
        <div class="echo-locked-title">${label}</div>
        <div class="echo-locked-sub">${T("upgrade_msg")}</div>
        <button class="echo-locked-btn">⭐ ${T("upgrade_btn")}</button>
      </div>
    </div>`;
}

/* ─── TITLES TAB ────────────────────────────────────────────── */
function renderTitles(data){
  const orig = esc((data&&data.title)||"");
  const html = `
    <div class="echo-card">
      <div class="echo-card-head">🩺 ${T("td_title")} <span class="echo-badge echo-badge-ai">Live + ${T("badge_ai")}</span>${help(T("h_titledoctor"))}</div>
      <input id="tdInput" value="${orig}" placeholder="${T("desc_title_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="flex:1;height:10px;background:#1a1a1a;border-radius:5px;overflow:hidden;"><div id="tdBar" style="height:100%;width:0;background:#888;transition:width .2s,background .2s;"></div></div>
        <span id="tdScore" style="font-size:16px;font-weight:800;color:#888;width:34px;text-align:right;">0</span>
      </div>
      <div id="tdChecks" style="display:flex;flex-wrap:wrap;gap:4px;"></div>
      <button class="echo-action-btn purple" id="btnTitleDoctor" style="margin-top:8px;">🩺 ${T("td_run")}</button>
      <div id="card-td-result"></div>
    </div>
    <div class="echo-card" id="card-titles-content">
      <div class="echo-card-head">${T("titles_section")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_titles"))}</div>
      <button class="echo-action-btn blue" id="btnLoadTitles">${T("titles_generate")}</button>
    </div>
    <div class="echo-card" id="card-titles-types">
      <div class="echo-card-head">${T("title_types")}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        ${[
          {key:"titles_seo",icon:"📈"},
          {key:"titles_ctr",icon:"🎯"},
          {key:"titles_viral",icon:"🔥"},
          {key:"titles_shorts",icon:"📱"},
          {key:"titles_trending",icon:"✨"},
        ].map(t=>`<div class="echo-title-type-pill" style="text-align:center;">${t.icon} ${T(t.key)}</div>`).join("")}
      </div>
    </div>
    <div class="echo-card" id="card-desc-pack">
      <div class="echo-card-head">📝 ${T("desc_section")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_desc"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px;">${T("desc_intro")}</div>
      <label style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">${T("desc_title")}</label>
      <input id="descTitle" value="${orig}" placeholder="${T("desc_title_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:8px;">
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        ${selectHTML("descNiche",NICHE_OPTIONS,T("audience_niche"),"flex:1;min-width:0;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;")}
        ${regionSelectHTML("descRegion",T("audience_target"),"flex:1;min-width:0;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;")}
      </div>
      <button class="echo-action-btn purple" id="btnDescPack">📝 ${T("desc_run")}</button>
      <div id="card-desc-result"></div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">🌐 ${T("tr_section")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_translate"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px;">${T("tr_intro")}</div>
      <select id="trLang" class="echo-lang-select" style="width:100%;box-sizing:border-box;padding:8px;margin-bottom:8px;">${LANG_LIST.map(l=>`<option value="${l.code}">${l.label}</option>`).join("")}</select>
      <button class="echo-action-btn blue" id="btnTranslate">🌐 ${T("tr_run")}</button>
      <div id="card-translate-result"></div>
    </div>
  `;
  return html;
}

/* ─── A/B TEST TAB ──────────────────────────────────────────── */
function renderABTest(data){
  const orig = esc(data.title||"");
  return `
    <div class="echo-card">
      <div class="echo-card-head">⚔️ A/B Test <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_abtest"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("abtest_intro")}</div>
      <label style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">${T("abtest_a")}</label>
      <textarea id="abTitleA" class="echo-ab-input" rows="2" placeholder="${T("abtest_a")}">${orig}</textarea>
      <label style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">${T("abtest_b")}</label>
      <textarea id="abTitleB" class="echo-ab-input" rows="2" placeholder="${T("abtest_b")}"></textarea>
      <button class="echo-action-btn blue" id="btnRunABTest">${T("abtest_run")}</button>
    </div>
    <div id="card-abtest-result"></div>
  `;
}

/* Bloc A/B de miniatures (affiché dans l'onglet Miniature) */
function renderThumbABSection(){
  return `
    <div class="echo-card">
      <div class="echo-card-head">📸 ${T("thumbab_title")} <span class="echo-badge echo-badge-ai">Vision</span>${help(T("h_thumbab"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("thumbab_intro")}</div>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <label style="flex:1;cursor:pointer;border:1px dashed #2a2a35;border-radius:8px;padding:10px;text-align:center;font-size:11px;color:#aaa;" id="lblThumbA">
          <div id="prevThumbA">⬆️ ${T("thumbab_a")}</div>
          <input type="file" id="fileThumbA" accept="image/*" style="display:none;">
        </label>
        <label style="flex:1;cursor:pointer;border:1px dashed #2a2a35;border-radius:8px;padding:10px;text-align:center;font-size:11px;color:#aaa;" id="lblThumbB">
          <div id="prevThumbB">⬆️ ${T("thumbab_b")}</div>
          <input type="file" id="fileThumbB" accept="image/*" style="display:none;">
        </label>
      </div>
      <button class="echo-action-btn purple" id="btnRunThumbAB">${T("thumbab_run")}</button>
    </div>
    <div id="card-thumbab-result"></div>
  `;
}

/* Redimensionne une image (File) en base64 JPEG (max 640px de large) */
function fileToScaledBase64(file, maxW=640){
  return new Promise((resolve,reject)=>{
    const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{
      const scale=Math.min(1, maxW/img.width);
      const w=Math.round(img.width*scale), h=Math.round(img.height*scale);
      const cv=document.createElement("canvas"); cv.width=w; cv.height=h;
      cv.getContext("2d").drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL("image/jpeg",0.85).replace(/^data:image\/jpeg;base64,/,""));
    };
    img.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error(T("err_image"))); };
    img.src=url;
  });
}

/* ─── SHORTS TAB ────────────────────────────────────────────── */
function renderShorts(data){
  return `
    <div class="echo-card" id="card-shorts-content">
      <div class="echo-card-head">🎬 ${T("nav_shorts")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_shorts"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("shorts_intro")}</div>
      <button class="echo-action-btn blue" id="btnGenShorts">${T("shorts_generate")}</button>
    </div>
    <div id="card-shorts-result"></div>
  `;
}

/* ─── RÉGION / AUDIENCE TAB ─────────────────────────────────── */
function renderAudience(){
  const langOpts=LANG_LIST.map(l=>`<option value="${l.code}" ${l.code===currentLanguage?"selected":""}>${l.label}</option>`).join("");
  return `
    <div class="echo-card">
      <div class="echo-card-head">🌍 ${T("nav_region")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_audience"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("audience_intro")}</div>
      <label style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">${T("audience_target")}</label>
      ${regionSelectHTML("audTarget",T("audience_target"),"width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:8px;")}
      <label style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">${T("audience_niche")}</label>
      ${selectHTML("audNiche",NICHE_OPTIONS,T("audience_niche"),"width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:8px;")}
      <label style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">${T("audience_lang")}</label>
      <select id="audLang" class="echo-lang-select" style="width:100%;margin-bottom:10px;padding:8px;">${langOpts}</select>
      <button class="echo-action-btn blue" id="btnAudience">🌍 ${T("audience_run")}</button>
      <div id="card-audience-result"></div>
    </div>
  `;
}

/* ─── SPONSOR / MONÉTISATION TAB ────────────────────────────── */
function renderSponsor(){
  const inp="flex:1;min-width:0;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;";
  return `
    <div class="echo-card">
      <div class="echo-card-head">💼 ${T("nav_sponsor")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_sponsor"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("sp_intro")}</div>
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        ${selectHTML("spNiche",NICHE_OPTIONS,T("audience_niche"),inp)}
        ${regionSelectHTML("spRegion",T("audience_target"),inp)}
      </div>
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input id="spSubs" type="text" placeholder="${T("sp_subs_ph")}" style="${inp}">
        <input id="spViews" type="text" placeholder="${T("sp_views_ph")}" style="${inp}">
      </div>
      <button class="echo-action-btn green" id="btnSponsor">💼 ${T("sp_run")}</button>
      <div id="card-sponsor-result"></div>
    </div>
  `;
}

/* ─── REVENUS TAB ───────────────────────────────────────────── */
function renderRevenue(data){
  const orig=esc((data&&data.title)||"");
  return `
    <div class="echo-card">
      <div class="echo-card-head">💰 ${T("nav_revenue")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_revenue"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("rev_intro")}</div>
      <input id="revTitle" value="${orig}" placeholder="${T("desc_title_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:8px;">
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        ${selectHTML("revNiche",NICHE_OPTIONS,T("audience_niche"),"flex:1;min-width:0;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;")}
        ${regionSelectHTML("revRegion",T("audience_target"),"flex:1;min-width:0;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;")}
      </div>
      <label style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">${T("rev_subs")}</label>
      <input id="revSubs" type="text" placeholder="${T("rev_subs_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:10px;">
      <button class="echo-action-btn green" id="btnRevenue">💰 ${T("rev_run")}</button>
      <div id="card-revenue-result"></div>
    </div>
  `;
}

/* ─── CHAÎNE (tableau de bord) TAB ──────────────────────────── */
function renderChannel(){
  return `
    <div class="echo-card">
      <div class="echo-card-head">📊 ${T("nav_channel")} <span class="echo-badge" style="background:rgba(255,0,0,.15);color:#ff5252">● LIVE</span>${help(T("h_channel"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("chan_intro")}</div>
      <button class="echo-action-btn purple" id="btnChannelDash">📊 ${T("chan_run")}</button>
      <div id="card-channel-result"></div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">🎞️ ${T("pl_section")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_playlists"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px;">${T("pl_intro")}</div>
      <button class="echo-action-btn blue" id="btnPlaylists">🎞️ ${T("pl_run")}</button>
      <div id="card-playlists-result"></div>
    </div>
  `;
}

/* ─── COMMENTAIRES TAB ──────────────────────────────────────── */
function renderComments(){
  return `
    <div class="echo-card">
      <div class="echo-card-head">💬 ${T("nav_comments")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_comments"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("com_intro")}</div>
      <button class="echo-action-btn purple" id="btnComments">💬 ${T("com_run")}</button>
      <div id="card-comments-result"></div>
    </div>
  `;
}

/* Récupère la transcription YouTube DEPUIS la page (cookies/session présents) → "[m:ss] texte" */
async function getYouTubeTranscript(videoId){
  const fmt=s=>{const mn=Math.floor(s/60),x=s%60;return mn+":"+String(x).padStart(2,"0");};
  const build=segs=>{ // segs: [{start, text}]
    let last=-100, lines=[];
    segs.forEach(s=>{
      const text=(s.text||"").replace(/\s+/g," ").trim();
      if(!text) return;
      if(s.start-last>=12){ lines.push("["+fmt(s.start)+"] "+text); last=s.start; }
      else if(lines.length) lines[lines.length-1]+=" "+text;
    });
    let t=lines.join("\n");
    return t.length>6000 ? t.slice(0,6000) : t;
  };
  /* 0) Panneau "Transcription" de YouTube (DOM) — la voie la plus fiable :
     les URLs timedtext sont désormais protégées par des jetons (réponses vides),
     mais le panneau transcription de la page contient tout, horodaté. */
  /* Cherche tous les éléments matchant un sélecteur, en perçant les Shadow DOM
     (les composants ytd-* de YouTube rendent souvent leur contenu dans un shadowRoot,
     invisible à un querySelectorAll classique depuis le document). */
  const deepQueryAll=(sel,root=document)=>{
    let out=[...root.querySelectorAll(sel)];
    const all=root.querySelectorAll("*");
    for(const el of all){ if(el.shadowRoot) out=out.concat(deepQueryAll(sel,el.shadowRoot)); }
    return out;
  };
  const deepQueryOne=(sel,root=document)=>deepQueryAll(sel,root)[0]||null;
  const scrapePanel=()=>{
    const nodes=deepQueryAll("ytd-transcript-segment-renderer");
    if(!nodes.length) return "";
    const toSec=t=>{const p=String(t).trim().split(":").map(Number);return p.length===3?p[0]*3600+p[1]*60+p[2]:(p[0]||0)*60+(p[1]||0);};
    const segs=nodes.map(n=>{
      const root=n.shadowRoot||n;
      const ts=(root.querySelector(".segment-timestamp,[class*='timestamp']")||n.querySelector(".segment-timestamp,[class*='timestamp']"))?.textContent||"0:00";
      const tx=(root.querySelector(".segment-text,yt-formatted-string.segment-text,[class*='segment-text']")||n.querySelector(".segment-text,yt-formatted-string.segment-text,[class*='segment-text']"))?.textContent||"";
      return {start:toSec(ts), text:tx};
    }).filter(s=>s.text.trim());
    return build(segs);
  };
  try{
    if(location.href.includes("v="+videoId)){
      let out=scrapePanel();
      if(out) return out;
      // Panneau fermé/en chargement → tenter de l'ouvrir automatiquement puis relire (jusqu'à ~12s)
      const btn=deepQueryOne("ytd-video-description-transcript-section-renderer button")
             || deepQueryOne("button[aria-label*='ranscript']")
             || deepQueryOne("button[aria-label*='ranscription']");
      if(btn){
        btn.click();
        for(let i=0;i<24;i++){
          await new Promise(r=>setTimeout(r,500));
          out=scrapePanel();
          if(out) return out;
        }
      }
    }
  }catch(e){ /* on tente les méthodes réseau ci-dessous */ }
  try{
    // 1) captionTracks depuis la page actuelle (tokens valides) sinon re-fetch
    let html = (location.href.includes("v="+videoId)) ? document.documentElement.innerHTML : "";
    let m = html && html.match(/"captionTracks":(\[.*?\])/);
    if(!m){
      const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { credentials:"include" });
      html = await res.text();
      m = html.match(/"captionTracks":(\[.*?\])/);
    }
    if(!m) return "";
    const tracks = JSON.parse(m[1].replace(/\\u0026/g,"&"));
    if(!tracks.length) return "";
    const track = tracks.find(t=>t.kind!=="asr") || tracks[0];
    const base = track.baseUrl.replace(/\\u0026/g,"&");

    // 2) Essayer plusieurs formats : json3, puis XML (souvent OK quand json3 est vide)
    const candidates = [
      base + (/[?&]fmt=/.test(base) ? "" : "&fmt=json3"),
      base.replace(/&fmt=\w+/,"") // XML par défaut
    ];
    for(const url of candidates){
      try{
        const cr = await fetch(url, { credentials:"include" });
        const txt = await cr.text();
        if(!txt || txt.length<20) continue;
        // json3 ?
        if(txt.trim().startsWith("{")){
          const cj = JSON.parse(txt);
          if(cj.events){
            const segs = cj.events.filter(e=>e.segs).map(e=>({start:Math.round((e.tStartMs||0)/1000), text:e.segs.map(s=>s.utf8).join("")}));
            const out = build(segs); if(out) return out;
          }
        } else {
          // XML <text start="..">…</text>
          const xml = new DOMParser().parseFromString(txt, "text/xml");
          const nodes = [...xml.querySelectorAll("text")];
          if(nodes.length){
            const ta=document.createElement("textarea");
            const segs = nodes.map(n=>{ ta.innerHTML=n.textContent||""; return {start:Math.round(parseFloat(n.getAttribute("start")||"0")), text:ta.value}; });
            const out = build(segs); if(out) return out;
          }
        }
      }catch(e){ /* format suivant */ }
    }
    return "";
  }catch(e){ return ""; }
}

/* ─── TENDANCES TAB ─────────────────────────────────────────── */
function renderTrends(){
  const inp="flex:1;min-width:0;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;";
  return `
    <div class="echo-card">
      <div class="echo-card-head">🔥 ${T("nav_trends")} <span class="echo-badge" style="background:rgba(255,0,0,.15);color:#ff5252">● LIVE</span>${help(T("h_trends"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("tre_intro")}</div>
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        ${selectHTML("treNiche",NICHE_OPTIONS,T("audience_niche"),inp)}
        ${regionSelectHTML("treRegion",T("audience_target"),inp)}
      </div>
      <button class="echo-action-btn purple" id="btnTrends">🔥 ${T("tre_run")}</button>
      <div id="card-trends-result"></div>
    </div>
  `;
}

/* ─── PLANIFICATEUR TAB ─────────────────────────────────────── */
function renderPlanner(){
  const inp="flex:1;min-width:0;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;";
  const freqOpts=["3 vidéos/semaine","1 vidéo/jour","2 Shorts/jour","Vidéo + Shorts"].map(f=>`<option value="${f}">${esc(optLabel(f))}</option>`).join("");
  return `
    <div class="echo-card">
      <div class="echo-card-head">📅 ${T("nav_planner")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_planner"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("plan_intro")}</div>
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        ${selectHTML("plNiche",NICHE_OPTIONS,T("audience_niche"),inp)}
        ${regionSelectHTML("plRegion",T("audience_target"),inp)}
      </div>
      <select id="plFreq" style="width:100%;box-sizing:border-box;${inp};margin-bottom:10px;"><option value="">${T("plan_freq")}</option>${freqOpts}</select>
      <button class="echo-action-btn blue" id="btnPlanner">📅 ${T("plan_run")}</button>
      <div id="card-planner-result"></div>
    </div>
  `;
}

/* ─── IDÉES DE VIDÉOS TAB ───────────────────────────────────── */
function renderTikTok(){
  return `
    <div class="echo-card">
      <div class="echo-card-head">🎵 TikTok SEO <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span></div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("tk_intro")}</div>
      <input id="tkTopic" placeholder="${T("tk_topic_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:8px;">
      ${selectHTML("tkNiche",NICHE_OPTIONS,T("audience_niche"),"width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;margin-bottom:8px;")}
      <input id="tkDesc" placeholder="${T("tk_desc_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:10px;">
      <button class="echo-action-btn blue" id="btnTikTok">🎵 ${T("tk_run")}</button>
      <div id="card-tiktok-result"></div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">♻️ ${T("tkr_title")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span></div>
      <div style="font-size:12px;color:#888;margin-bottom:8px;">${T("tkr_intro")}</div>
      <button class="echo-action-btn purple" id="btnTkRepurpose">♻️ ${T("tkr_run")}</button>
      <div id="card-tkrep-result"></div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">🔥 ${T("tki_title")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span></div>
      ${selectHTML("tkiNiche",NICHE_OPTIONS,T("audience_niche"),"width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;margin-bottom:8px;")}
      <input id="tkiTopic" placeholder="${T("tk_topic_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:10px;">
      <button class="echo-action-btn blue" id="btnTkIdeas">🔥 ${T("tki_run")}</button>
      <div id="card-tkideas-result"></div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">🪝 ${T("tkh_title")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span></div>
      <input id="tkhTopic" placeholder="${T("tk_topic_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:8px;">
      ${selectHTML("tkhNiche",NICHE_OPTIONS,T("audience_niche"),"width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;margin-bottom:10px;")}
      <button class="echo-action-btn blue" id="btnTkHooks">🪝 ${T("tkh_run")}</button>
      <div id="card-tkhooks-result"></div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">📅 ${T("tkc_title")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span></div>
      ${selectHTML("tkcNiche",NICHE_OPTIONS,T("audience_niche"),"width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;margin-bottom:8px;")}
      <input id="tkcFreq" placeholder="${T("tkc_freq_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:10px;">
      <button class="echo-action-btn blue" id="btnTkCal">📅 ${T("tkc_run")}</button>
      <div id="card-tkcal-result"></div>
    </div>`;
}

function renderIdeas(){
  return `
    <div class="echo-card">
      <div class="echo-card-head">💡 ${T("nav_ideas")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_ideas"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;">${T("idea_intro")}</div>
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        ${selectHTML("ideaNiche",NICHE_OPTIONS,T("audience_niche"),"flex:1;min-width:0;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;")}
        ${regionSelectHTML("ideaRegion",T("audience_target"),"flex:1;min-width:0;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;")}
      </div>
      <input id="ideaTopic" placeholder="${T("idea_topic_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:10px;">
      <button class="echo-action-btn blue" id="btnIdeas">💡 ${T("idea_run")}</button>
      <div id="card-ideas-result"></div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">📣 ${T("cp_section")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_community"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px;">${T("cp_intro")}</div>
      <button class="echo-action-btn purple" id="btnCommunity">📣 ${T("cp_run")}</button>
      <div id="card-community-result"></div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">📝 ${T("sc_section")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${help(T("h_script"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:8px;">${T("sc_intro")}</div>
      <input id="scTopic" placeholder="${T("sc_topic_ph")}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        ${selectHTML("scNiche",NICHE_OPTIONS,T("audience_niche"),"flex:1;min-width:0;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;")}
        <select id="scDur" style="flex:1;min-width:0;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;"><option value="">${T("sc_dur")}</option><option value="Short (<60s)">Short</option><option value="5-10 min">5-10 min</option><option value="10-20 min">10-20 min</option><option value="20+ min">20+ min</option></select>
      </div>
      <button class="echo-action-btn blue" id="btnScript">📝 ${T("sc_run")}</button>
      <div id="card-script-result"></div>
    </div>
  `;
}

/* Identifiant d'appareil persistant (verrouillage anti-revente) */
function getDeviceId(){
  return new Promise(resolve=>{
    chrome.storage.local.get("device_id",r=>{
      if(r.device_id) return resolve(r.device_id);
      const id="dev_"+(crypto.randomUUID?crypto.randomUUID():Date.now()+"_"+Math.random().toString(36).slice(2));
      chrome.storage.local.set({device_id:id},()=>resolve(id));
    });
  });
}

/* ─── ACTIONS TAB ───────────────────────────────────────────── */
function renderActions(data){
  return `
    <div class="echo-actions-grid">
      <button class="echo-btn blue"   id="btnCopyTitle">${T("act_copy_title")}</button>
      <button class="echo-btn red"    id="btnGenDesc">${T("act_description")}</button>
      <button class="echo-btn purple" id="btnGenTags">${T("act_tags")}</button>
      <button class="echo-btn green"  id="btnOpenThumb">${T("act_thumbnail")}</button>
    </div>
    <div id="card-action-result" style="display:none">
      <div class="echo-card">
        <div class="echo-card-head" id="action-result-title"></div>
        <div id="action-result-content"></div>
      </div>
    </div>
    <button class="echo-full-report-btn" id="btnFullReport2">${T("act_full_report")}</button>
  `;
}

/* ══════════════════════════════════════════════════════════════
   CRÉATION DU PANEL
══════════════════════════════════════════════════════════════ */
/* Limite quotidienne du plan Gratuit (3 analyses/jour) */
/* Quota du plan gratuit : une seule source de vérité (le panneau de limite
   affichait « 3/3 » écrit en dur à côté du test `>=3`). */
const FREE_DAILY_LIMIT = 3;
let freeLimitReached = false;
async function isFreeLimitReached(videoId){
  if(currentPlan!=="free") return false;
  try{
    const today=new Date().toISOString().slice(0,10);
    const {freeUsage}=await new Promise(r=>chrome.storage.local.get("freeUsage",r));
    let u=freeUsage;
    if(!u||u.date!==today) u={date:today,videos:[]};
    if(u.videos.includes(videoId)) return false;       // vidéo déjà comptée aujourd'hui → autorisée
    if(u.videos.length>=FREE_DAILY_LIMIT) return true; // quota du jour atteint → bloqué
    u.videos.push(videoId);
    await new Promise(r=>chrome.storage.local.set({freeUsage:u},r));
    return false;
  }catch(e){ return false; }                            // en cas d'erreur, on n'empêche pas (fail-open)
}
function renderFreeLimitPanel(){
  return `
    <div class="echo-empty" role="status">
      <div class="echo-empty-icon">⏳</div>
      <div class="echo-empty-title">${T("fl_title")}</div>
      <div class="echo-empty-sub">${T("fl_msg").replace("{n}",FREE_DAILY_LIMIT)}</div>
      <button class="echo-locked-btn" id="btnFreeLimitUpgrade">⭐ ${T("upgrade_btn")}</button>
    </div>`;
}

async function createPanel(){
  if(!extAlive())return;   // extension rechargée → on n'essaie pas d'appeler chrome.*
  if(panelCreating)return; // Empêcher les appels simultanés
  if(!isVideoPage()){
    const old=document.getElementById("echo-rank-panel");
    if(old){old.remove();panelMounted=false;}
    hidePanelToggle();
    removeStatsCard();
    return;
  }
  const data=getVideoData();
  if(!data)return;
  if(panelMounted&&data.videoId===currentVideoId)return;

  // Limite quotidienne du plan Gratuit
  freeLimitReached = await isFreeLimitReached(data.videoId);

  panelCreating=true; // Verrouiller
  const old=document.getElementById("echo-rank-panel");
  if(old)old.remove();
  panelMounted=false;

  /* ── Pas encore activé → ne RIEN afficher automatiquement (plus de panneau flottant
     imposé). Le bouton VidSpark du masthead reste la seule porte d'entrée : cliquer dessus
     affiche le formulaire de connexion À L'INTÉRIEUR du shell (voir toggleShellPanel). ── */
  if(!currentUserToken || !currentUserEmail){
    const existing = document.getElementById('echo-rank-panel');
    if (existing) existing.remove();
    removeStatsCard();
    panelMounted=true;
    panelCreating=false; // Déverrouiller
    return;
  }

  currentVideoId=data.videoId;

  /* Analyse de la miniature AVANT le premier rendu : le Coach affiche le score
     global dès l'ouverture, il ne doit pas afficher un chiffre puis le corriger.
     Fonction bornée à 2,5 s, et le score reste juste (renormalisé) si l'image
     n'est pas mesurable. */
  await ensureThumbAnalysis(data.videoId);

  const seoScore    =computeSEOScore(data.title,data.descLength);
  const viralScore  =computeViralScore(data.title,data.descLength,seoScore);
  const thumbScore  =computeThumbScore(data.videoId);
  const globalScore =computeGlobalScore(seoScore,viralScore,thumbScore);
  const ctrEstimated=computeCTR(seoScore,viralScore,thumbScore);
  const scores      ={seo:seoScore,viral:viralScore,thumb:thumbScore,global:globalScore,ctr:ctrEstimated,
                      seoPot:computeSEOPotential(data.title,data.descLength),
                      viralPot:computeViralPotential(data.title,data.descLength,seoScore)};
  const checklist =buildChecklist(data.title,data.descLength);
  lastPanelData=data; lastPanelScores=scores; lastPanelChecklist=checklist;

  injectStatsCard(data,scores);

  const langOpts=LANG_LIST.map(l=>
    `<option value="${l.code}" ${l.code===currentLanguage?"selected":""}>${l.label}</option>`
  ).join("");

  const savedGeom = await getSavedGeometry();

  const panel=document.createElement("div");
  panel.id="echo-rank-panel";
  panel.setAttribute("role","region");
  panel.setAttribute("aria-label","VidSpark AI");
  if(data.isShort)panel.classList.add("echo-shorts-mode");

  /* En-tête : la langue et la réactivation de code sont deux réglages consultés
     très rarement — ils quittent la barre permanente pour un menu compte, ce qui
     rend la place au titre du produit. Les deux éléments restent dans le panneau,
     donc leurs écouteurs (panel.querySelector) continuent de les trouver.
     Poignée de drag + bouton de fenêtre : le panneau est désormais une fenêtre
     flottante (voir applyGeometry/enablePanelChrome plus bas), pas un widget
     ancré dans la colonne YouTube. */
  panel.innerHTML=`
    <div class="echo-header">
      <div class="echo-header-left">
        <span class="echo-drag-grip" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
        <span class="echo-logo">⚡</span>
        <div><h1>VidSpark AI</h1><p>YouTube SEO Intelligence</p></div>
      </div>
      <div class="echo-header-right">
        <span class="echo-plan-badge ${currentPlan}">${T("plan_"+currentPlan)}</span>
        <div class="echo-acct">
          <button class="echo-acct-btn" id="echoAcctBtn" aria-haspopup="true" aria-expanded="false" aria-controls="echoAcctMenu" title="${esc(currentUserName||"")}">
            ${currentUserAvatar?`<img class="echo-user-avatar" src="${currentUserAvatar}" alt="">`:`<span class="echo-acct-ico">👤</span>`}
            <span class="echo-acct-caret">⌄</span>
          </button>
          <div class="echo-acct-menu" id="echoAcctMenu" role="menu" hidden>
            ${currentUserName?`<div class="echo-acct-who">${esc(currentUserName)}</div>`:""}
            <label class="echo-acct-row">
              <span>🌐</span>
              <select class="echo-lang-select" id="echoLangSelect" aria-label="${esc(T("lang_changed"))}">${langOpts}</select>
            </label>
            <a class="echo-acct-item" role="menuitem" href="https://vidsparkpro.com/dashboard.html" target="_blank" rel="noopener">📊 Dashboard</a>
            <button class="echo-acct-item is-danger" role="menuitem" id="btnReactivate">🔑 ${T('reactivate_tip')}</button>
          </div>
        </div>
        <button class="echo-win-btn" id="echoPanelHide" type="button" title="${esc(T('co_chat_close'))}" aria-label="${esc(T('co_chat_close'))}">–</button>
      </div>
    </div>

    <div class="echo-tab-bar-wrap">
      <div class="echo-tab-bar" id="echoSectionBar" role="tablist" aria-label="VidSpark AI">
        ${SECTIONS.map(s=>`<button class="echo-tab-btn ${s.id===activeSection?"active":""}" role="tab" aria-selected="${s.id===activeSection}" data-section="${s.id}">${s.icon} ${T(s.key)}</button>`).join("")}
      </div>
      <div class="echo-tab-bar echo-subtab-bar" id="echoSubTabBar" role="tablist" style="${(SECTIONS.find(s=>s.id===activeSection)?.tabs||[]).filter(t=>t!=="coach").length?'':'display:none;'}">
        ${(SECTIONS.find(s=>s.id===activeSection)?.tabs||[]).filter(t=>t!=="coach").map(tab=>`<button class="echo-tab-btn echo-subtab ${tab===activeTab?"active":""}" role="tab" aria-selected="${tab===activeTab}" data-tab="${tab}">${T("nav_"+tab)}</button>`).join("")}
      </div>
    </div>

    <div class="echo-tab-content" id="echoTabContent" role="tabpanel">
      ${renderTabContent(activeTab,data,scores,checklist)}
    </div>
    <div class="echo-resize-handle" id="echoResizeHandle" aria-hidden="true">⇲</div>
  `;

  document.body.appendChild(panel);
  applyGeometry(panel, savedGeom);
  addShortsToggle(panel);
  enablePanelChrome(panel);

  /* Masqué par défaut — réutilise EXACTEMENT le mécanisme déjà existant (echoPanelHide /
     echo-shorts-toggle, voir enablePanelChrome/addShortsToggle juste au-dessus) plutôt que
     d'en inventer un parallèle avec style.display. Une seule fenêtre au total : ce panneau
     EST déjà une app complète (en-tête, onglets, menu compte, drag/resize) ; le bouton
     VidSpark du masthead se contente de l'afficher/masquer (toggleShellPanel). */
  panel.classList.add('echo-panel-hidden');
  document.getElementById('echo-shorts-toggle')?.classList.remove('echo-toggle-hidden');

  panelMounted=true;
  panelCreating=false; // Déverrouiller

  /* ── RTL ARABE ── */
  if(currentLanguage==="ar"){
    panel.setAttribute("dir","rtl");
    panel.classList.add("echo-rtl");
  } else {
    panel.removeAttribute("dir");
    panel.classList.remove("echo-rtl");
  }

  bindPanelEvents(panel,data,scores,checklist);
  consumePendingSection();
}

/* ══════════════════════════════════════════════════════════════
   🧠 COACH IA — écran d'accueil
   ──────────────────────────────────────────────────────────────
   Moteur de règles 100 % local : il lit la checklist déjà produite par
   buildChecklist() (label / detail / why / impact / gain / example / weight)
   au lieu de trois seuils en dur. Aucun appel réseau pour établir un chiffre :
   le verdict et les priorités s'affichent avant toute requête.
══════════════════════════════════════════════════════════════ */

/* Barème de temps par correction, en minutes. C'est un barème documenté,
   pas une mesure — d'où l'étiquette « estimé » côté interface. */
const COACH_MINUTES = { len:2, num:1, em:2, hk:3, punct:1, desc:4, thumb:8, short:15, comp:5 };
const COACH_ICON    = { len:"✍️", num:"🔢", em:"💥", hk:"🪝", punct:"❓", desc:"📝", thumb:"🎨", short:"📱", comp:"🏆" };

/* Destination de chaque correction : onglet + bouton déclenché automatiquement.
   thumb → btnThumbAI (action "thumbnail", route /activation/ai/thumbnail) et non
   btnThumbIdeas : l'action thumbnail_ideas n'a pas de route côté backend, le
   parcours principal du Coach échouait donc systématiquement. */
const COACH_ROUTE = {
  len:  {goto:"titles",     run:"btnTitleDoctor"},
  num:  {goto:"titles",     run:"btnTitleDoctor"},
  em:   {goto:"titles",     run:"btnLoadTitles"},
  hk:   {goto:"titles",     run:"btnTitleDoctor"},
  punct:{goto:"titles",     run:"btnTitleDoctor"},
  desc: {goto:"titles",     run:"btnDescPack"},
  thumb:{goto:"thumbnail",  run:"btnThumbAI"},
  short:{goto:"shorts",     run:"btnGenShorts"},
  comp: {goto:"competitor", run:"btnRealComp"}
};

/* Corrections déjà lancées pour la vidéo courante (mémoire de session). */
let coachFixDone  = [];
let coachFixVideo = null;
function coachResetFixes(videoId){
  if(coachFixVideo!==videoId){ coachFixVideo=videoId; coachFixDone=[]; }
}

/* Construit le plan d'action trié par impact réel (poids × gain). */
function buildCoachActions(data,scores,checklist){
  const acts=[];
  const num = v => parseInt(String(v||"").replace(/[^\d]/g,""),10)||0;

  (checklist||[]).forEach(c=>{
    if(c.status!=="fix" || !c.key) return;
    const r=COACH_ROUTE[c.key]; if(!r) return;
    acts.push({
      key:c.key, icon:COACH_ICON[c.key]||"•",
      title:c.label, why:c.why||c.detail||"", detail:c.detail||"",
      example:c.example||"", impact:c.impact||"",
      gain:Math.max(2,num(c.gain)), weight:c.weight||10,
      minutes:COACH_MINUTES[c.key]||3, goto:r.goto, run:r.run
    });
  });

  const viral=Math.round(scores.viral||0);
  /* Miniature : proposée seulement si elle a vraiment été mesurée, et le
     « pourquoi » cite le défaut mesuré (image sombre, plate, chargée…) plutôt
     qu'une phrase générique. */
  const thumb=scores.thumb==null?null:Math.round(scores.thumb);
  const weak=thumbWeakness(data.videoId);
  if(thumb!=null && thumb<78) acts.push({
    key:"thumb", icon:COACH_ICON.thumb, title:T("co_a_thumb"),
    why:weak?weak.text+" "+T("co_w_thumb"):T("co_w_thumb"),
    detail:"", example:"", impact:"", gain:Math.max(4,Math.round((92-thumb)*0.40)),
    weight:22, minutes:COACH_MINUTES.thumb, ...COACH_ROUTE.thumb
  });
  if(viral<78 && !data.isShort) acts.push({
    key:"short", icon:COACH_ICON.short, title:T("co_a_short"), why:T("co_w_short"),
    detail:"", example:"", impact:"", gain:Math.max(3,Math.round((92-viral)*0.25)),
    weight:12, minutes:COACH_MINUTES.short, ...COACH_ROUTE.short
  });
  /* Vidéo déjà solide : le prochain gain ne vient plus d'un défaut mais de l'écart
     avec la concurrence. On propose donc une opportunité, pas une correction. */
  if(acts.length<3) acts.push({
    key:"comp", icon:COACH_ICON.comp, title:T("co_a_comp"), why:T("co_w_comp"),
    detail:"", example:"", impact:"", gain:5, weight:8,
    minutes:COACH_MINUTES.comp, ...COACH_ROUTE.comp
  });

  acts.sort((a,b)=>(b.weight*b.gain)-(a.weight*a.gain));
  return acts;
}

function renderCoach(data,scores,checklist){
  coachResetFixes(data.videoId);

  const seo=Math.round(scores.seo||0), viral=Math.round(scores.viral||0);
  const thumb=scores.thumb==null?null:Math.round(scores.thumb);
  const global=Math.round(scores.global||computeGlobalScore(seo,viral,thumb));
  const acts=buildCoachActions(data,scores,checklist);
  const top=acts.slice(0,5), rest=acts.slice(5);

  const totalGain=top.reduce((s,a)=>s+a.gain,0);
  const totalMin =top.reduce((s,a)=>s+a.minutes,0);
  const reachable=Math.min(96,global+totalGain);
  const pct=Math.max(4,Math.round((global/Math.max(reachable,1))*100));
  const gc=scoreColor(global);

  const rank=g=>g>=14?"hi":g>=7?"mid":"low";
  const bullet=r=>r==="hi"?"🔴":r==="mid"?"🟠":"🟡";

  /* Prochaine correction non encore lancée : c'est elle que pilote le bouton principal. */
  const nextIdx=top.findIndex(a=>!coachFixDone.includes(a.key));
  const next=nextIdx>=0?top[nextIdx]:null;
  const doneCount=top.filter(a=>coachFixDone.includes(a.key)).length;

  const row=(a,i)=>{
    const done=coachFixDone.includes(a.key);
    const r=rank(a.gain);
    return `
    <div class="echo-co-row ${done?"is-done":""} ${a.key===(next&&next.key)?"is-next":""}" data-key="${a.key}">
      <span class="echo-co-rank">${done?"✓":bullet(r)}</span>
      <div class="echo-co-body">
        <div class="echo-co-title">${a.icon} ${esc(a.title)}</div>
        <div class="echo-co-meta"><span dir="ltr" class="echo-co-gain">+${a.gain}</span> · <span>${a.minutes} ${T("co_min")}</span></div>
        ${a.why?`<div class="echo-co-why">${esc(a.why)}</div>`:""}
      </div>
      <button class="echo-co-go coach-goto" data-goto="${a.goto}" data-run="${a.run||''}" data-key="${a.key}"
              aria-label="${esc(T("co_fix"))} — ${esc(a.title)}">${T("co_fix")} →</button>
    </div>`;
  };

  const good=(checklist||[]).filter(c=>c.status==="ok").map(c=>c.label);
  if(seo>=78)   good.push(T("coach_ok_title"));
  if(thumb>=78) good.push(T("coach_ok_thumb"));
  if(viral>=78) good.push(T("coach_ok_viral"));

  const summary = acts.length===0 ? T("co_allgood")
    : (acts.length===1 ? T("co_found1") : T("co_found").replace("{n}",acts.length));

  const lead = next ? (next.detail || next.why) : "";

  return `
    <section class="echo-co-hero" aria-label="${esc(T("co_label"))}">
      <div class="echo-co-hero-label">${T("co_label")}</div>
      <div class="echo-co-scores" dir="ltr">
        <span class="echo-co-now" style="color:${gc}" data-count-to="${global}">${global}</span>
        <span class="echo-co-arrow">→</span>
        <span class="echo-co-soon" data-count-to="${reachable}">${reachable}</span>
      </div>
      <div class="echo-co-hero-sub"><span>${T("co_now")}</span><span>${T("co_soon")}</span></div>
      <div class="echo-co-track"><div class="echo-co-fill" style="--co-pct:${pct}%"></div></div>
      ${acts.length?`<div class="echo-co-hero-meta" dir="ltr">⏱ ${totalMin} ${T("co_min")} · ⚡ +${totalGain} ${T("co_pts")}</div>`:""}
    </section>

    <section class="echo-co-summary" aria-live="polite">
      <div class="echo-co-sum-head"><span class="echo-co-spark">✦</span> ${esc(summary)}</div>
      ${lead?`<p class="echo-co-lead">${esc(lead)}</p>`:""}
      ${next?`<button class="echo-co-cta" id="btnCoachAutofix" data-goto="${next.goto}" data-run="${next.run||''}" data-key="${next.key}">
        ⚡ ${doneCount?T("co_next"):T("co_autofix")}${doneCount?` <span class="echo-co-step">${T("co_af_step").replace("{i}",doneCount+1).replace("{of}",T("co_of")).replace("{n}",top.length)}</span>`:""}
      </button>`:`<button class="echo-co-cta coach-goto" data-goto="trends">🔥 ${T("co_grow")} →</button>`}
      <button class="echo-co-ask" id="btnCoachAsk">
        <span class="echo-co-ask-ic" aria-hidden="true">💬</span>
        <span class="echo-co-ask-txt">
          <span class="echo-co-ask-t">${T("co_chat_open")}</span>
          <span class="echo-co-ask-s">${T("co_chat_sub")}</span>
        </span>
      </button>
    </section>

    ${top.length?`
    <section class="echo-co-list">
      <h3 class="echo-co-h">${T("co_prio")}</h3>
      ${top.map(row).join("")}
      ${rest.length?`
        <button class="echo-co-toggle" id="btnCoachMore" aria-expanded="false" aria-controls="coachRest">${T("co_more")} (${rest.length}) ⌄</button>
        <div id="coachRest" hidden>${rest.map(row).join("")}</div>`:""}
    </section>`:""}

    ${good.length?`
    <section class="echo-co-good">
      <h3 class="echo-co-h">${T("co_ok")}</h3>
      <div class="echo-co-chips">${good.slice(0,6).map(g=>`<span class="echo-co-chip">✓ ${esc(g)}</span>`).join("")}</div>
    </section>`:""}

    <button class="echo-co-tertiary" id="btnFullReport">${T("co_report")}</button>
  `;
}

/* Anime les deux scores du hero : compte progressivement jusqu'à la valeur cible.
   Respecte prefers-reduced-motion (affichage immédiat, aucune animation). */
function animateCoachHero(root){
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.querySelectorAll("[data-count-to]").forEach(el=>{
    const to=parseInt(el.dataset.countTo,10)||0;
    if(reduce){ el.textContent=to; return; }
    const from=Math.max(0,to-Math.min(24,to));
    const dur=900, t0=performance.now();
    const ease=x=>1-Math.pow(1-x,3);
    const step=now=>{
      const p=Math.min(1,(now-t0)/dur);
      el.textContent=Math.round(from+(to-from)*ease(p));
      if(p<1) requestAnimationFrame(step);
    };
    el.textContent=from;
    requestAnimationFrame(step);
  });
}

/* ══════════════════════════════════════════════════════════════
   💬 COACH CONVERSATIONNEL
   ──────────────────────────────────────────────────────────────
   Les réponses sont composées à partir des données réellement calculées pour
   cette vidéo (scores + champs detail / why / impact / example de la checklist,
   déjà traduits dans les 14 langues). Rien n'est inventé, et rien n'est envoyé
   au réseau pour répondre : le Coach ne parle que de ce qu'il a mesuré, et
   renvoie vers l'outil existant quand l'action demande un appel IA.
══════════════════════════════════════════════════════════════ */
/* Mots-clés de reconnaissance d'intention, pour les questions TAPÉES librement.
   Table nommée plutôt qu'une chaîne de `else if` : c'est ce qui permet aux puces
   de suggestion d'imposer leur intention sans dépendre de leur propre
   traduction (voir COACH_SUGG dans ensureCoachDock).
   L'ordre compte : la première branche qui matche gagne. */
const COACH_INTENTS=[
  {name:"ctr",  kw:["ctr","clic","click","taux","نقر","点击","クリック","클릭","кли","klik"]},
  {name:"next", kw:["ensuite","next","suite","faire","prochain","after","التالي","بعد ذلك","接下来","次に","다음","дальше","daarna","sonra","siguiente","seguir","aftur","hacer ahora","nächstes","adesso","şimdi ne","क्या करना","下一步","nu doen"]},
  {name:"flat", kw:["décolle","decolle","decolla","marche pas","ne marche","vues","views","flat","stuck","taking off","انتشار","مشاهدات","ينتشر","不起","起不来","伸び","안 되","뜨지","не набира","groei","büyü","despega","decola","in gang","van de grond","tutmuyor","नहीं चल"]},
  {name:"comp", kw:["concurrent","concurrence","competitor","rival","منافس","竞争","競合","경쟁","конкурент","rakip","rakib","competidor","concorrente","प्रतियोगी","konkurrenz"]},
  {name:"thumb",kw:["miniature","thumbnail","vignette","image","صورة","缩略","サムネ","썸네","обложк","afbeelding","küçük resim","थंबनेल"]},
  {name:"title",kw:["titre","title","عنوان","标题","タイトル","제목","заголов","titel","başlık","título","शीर्षक"]},
  {name:"desc", kw:["description","desc","وصف","描述","説明","설명","описан","beschrijving","açıklama","descrição","विवरण"]},
  {name:"short",kw:["short","viral","reel","انتشار","短视频","ショート","쇼츠","вирус","kort","kısa","corto","curto"]},
  {name:"score",kw:["score","pourquoi","why","note","درجة","分数","スコア","점수","оценк","waarom","puan","puntuación","pontuação","स्कोर"]}
];

function detectCoachIntent(s){
  const hit=COACH_INTENTS.find(b=>b.kw.some(x=>x&&s.includes(x)));
  return hit?hit.name:null;
}

/* `forcedIntent` : renseigné quand la question vient d'une puce de suggestion.
   Sans lui, une suggestion dont la traduction ne contient aucun mot-clé de sa
   propre branche retombait sur le repli « je n'ai pas de réponse fiable » — le
   Coach ne savait pas répondre à ce qu'il venait lui-même de proposer. */
function coachAnswer(q,data,scores,checklist,forcedIntent){
  const s=(q||"").toLowerCase();
  const seo=Math.round(scores.seo||0), viral=Math.round(scores.viral||0);
  const thumb=scores.thumb==null?null:Math.round(scores.thumb);
  const global=Math.round(scores.global||computeGlobalScore(seo,viral,thumb));
  const ctr=scores.ctr||computeCTR(seo,viral,thumb);
  const weak=thumbWeakness(data.videoId);
  const acts=buildCoachActions(data,scores,checklist);
  const find=k=>(checklist||[]).find(c=>c.key===k);
  const intent=forcedIntent||detectCoachIntent(s);
  const is=n=>intent===n;
  const lines=[], chips=[];

  const pushFix=c=>{
    if(!c||c.status!=="fix")return false;
    if(c.detail) lines.push(c.detail);
    if(c.why)    lines.push(c.why);
    if(c.impact) lines.push(T("seo_impact")+" : "+c.impact);
    if(c.example)lines.push(T("example_label")+" "+c.example);
    const r=COACH_ROUTE[c.key];
    if(r) chips.push({label:c.label,goto:r.goto,run:r.run,key:c.key});
    return true;
  };
  const pushAct=a=>{ if(!a)return; lines.push(a.title+" — "+a.why); lines.push("⚡ +"+a.gain+" · ⏱ "+a.minutes+" "+T("co_min")); chips.push({label:a.title,goto:a.goto,run:a.run,key:a.key}); };

  /* CTR / clics → miniature + titre, les deux seuls leviers du clic */
  if(is("ctr")){
    lines.push(T("overview_ctr_label")+" : "+ctr+"% ("+T("score_thumb")+" "+fmtScore(thumb)+"/100, "+T("score_seo")+" "+seo+"/100)");
    if(thumb!=null && thumb<78){
      if(weak) lines.push(weak.text);
      lines.push(T("co_w_thumb"));
      chips.push({label:T("co_a_thumb"),goto:"thumbnail",run:"btnThumbAI",key:"thumb"});
    }else if(thumb==null) lines.push(T("th_none"));
    ["hk","em","len","punct"].some(k=>pushFix(find(k)));
  }
  /* Que faire ensuite */
  else if(is("next")){
    if(acts.length) pushAct(acts[0]); else lines.push(T("co_allgood"));
  }
  /* La vidéo ne décolle pas */
  else if(is("flat")){
    lines.push(T("co_label")+" : "+global+"/100 → "+Math.min(96,global+acts.reduce((x,a)=>x+a.gain,0)));
    acts.slice(0,2).forEach(a=>pushAct(a));
  }
  /* Concurrence */
  else if(is("comp")){
    lines.push(T("co_w_comp"));
    chips.push({label:T("real_comp_title"),goto:"competitor",run:"btnRealComp",key:"comp"});
  }
  /* Miniature */
  else if(is("thumb")){
    lines.push(T("score_thumb")+" : "+fmtScore(thumb)+"/100");
    /* On cite les mesures réelles avant le conseil générique. Le message
       « non mesurable » suit le score affiché, jamais l'inverse. */
    const an=thumb==null?null:thumbAnalysis(data.videoId);
    if(an&&an.sub) lines.push(THUMB_METRICS.map(m=>T(m.i18n)+" "+an.sub[m.k]+"%").join(" · "));
    else lines.push(T("th_none"));
    if(weak) lines.push(weak.text);
    lines.push(T("co_w_thumb"));
    chips.push({label:T("thumb_ai_title"),goto:"thumbnail",run:"btnThumbAI",key:"thumb"});
  }
  /* Titre */
  else if(is("title")){
    lines.push(T("score_seo")+" : "+seo+"/100 — "+(data.title||"").length+" "+T("title_chars"));
    if(!["len","hk","em","num","punct"].some(k=>pushFix(find(k)))) lines.push(T("coach_ok_title"));
    chips.push({label:T("td_title"),goto:"titles",run:"btnTitleDoctor",key:"len"});
  }
  /* Description */
  else if(is("desc")){
    lines.push((data.descLength||0)+" "+T("desc_chars"));
    if(!pushFix(find("desc"))) lines.push(T("impact_desc_ok"));
    chips.push({label:T("desc_section"),goto:"titles",run:"btnDescPack",key:"desc"});
  }
  /* Short / viral */
  else if(is("short")){
    lines.push(T("score_viral")+" : "+viral+"/100");
    lines.push(T("co_w_short"));
    chips.push({label:T("nav_shorts"),goto:"shorts",run:"btnGenShorts",key:"short"});
  }
  /* Score / pourquoi */
  else if(is("score")){
    lines.push(T("score_global")+" "+global+" · "+T("score_seo")+" "+seo+" · "+T("score_viral")+" "+viral+" · "+T("score_thumb")+" "+thumb);
    acts.slice(0,2).forEach(a=>pushAct(a));
  }
  /* Repli honnête : on dit qu'on ne sait pas, puis on donne les faits mesurés. */
  else {
    lines.push(T("co_unknown"));
    lines.push(T("score_global")+" "+global+"/100 · "+T("overview_ctr_label")+" "+ctr+"%");
    if(acts.length) pushAct(acts[0]);
  }

  const seen=new Set();
  return {lines:lines.filter(Boolean), chips:chips.filter(c=>{ if(seen.has(c.label))return false; seen.add(c.label); return true; }).slice(0,3)};
}

/* ── CHAT IA RÉEL ─────────────────────────────────────────────────
   Le dock interrogeait uniquement coachAnswer(), qui compose des phrases à
   partir de mesures locales : utile, mais ce n'est pas une conversation — toute
   question sortant des 9 intentions prévues tombait sur « je n'ai pas de
   réponse fiable ». On appelle désormais le vrai moteur conversationnel,
   /api/user/coach-chat, celui-là même qu'utilise le tableau de bord.

   Authentification par jeton Bearer (déjà en stockage depuis la connexion au
   site) : aucune route ni aucun changement backend n'est nécessaire.
   Repli sur la réponse locale si le jeton manque, si le réseau échoue ou si le
   quota est atteint — cette réponse-là est traduite dans les 14 langues et
   reste exacte, donc l'utilisateur n'est jamais bloqué. */
const COACH_API="https://vidspark-ai-production-9ac7.up.railway.app/api/user/coach-chat";

/* Faits mesurés de la vidéo courante, transmis au modèle comme premier tour de
   conversation. Le backend ne connaît que le compte, pas la vidéo regardée.
   Uniquement des valeurs réellement mesurées : un score non mesurable est
   annoncé comme tel, jamais remplacé par un nombre. */
function coachVideoContext(data,scores){
  const f=[];
  if(data.title)               f.push(`titre="${String(data.title).slice(0,120)}"`);
  if(data.title)               f.push(`longueur_titre=${String(data.title).length}`);
  if(data.descLength!=null)    f.push(`longueur_description=${data.descLength}`);
  const g=scores.global==null?null:Math.round(scores.global);
  if(g!=null)                  f.push(`score_global=${g}/100`);
  if(scores.seo!=null)         f.push(`score_seo=${Math.round(scores.seo)}/100`);
  if(scores.viral!=null)       f.push(`score_viral=${Math.round(scores.viral)}/100`);
  f.push(`score_miniature=${scores.thumb==null?"non mesurable":Math.round(scores.thumb)+"/100"}`);
  if(scores.ctr!=null)         f.push(`ctr_estime=${scores.ctr}%`);
  return "[Contexte de la vidéo analysée] "+f.join(" ; ");
}

async function coachChatAI(message,history,data,scores){
  const st=await new Promise(r=>chrome.storage.local.get(["userToken"],r));
  if(!st.userToken) return null;                       // pas connecté → repli local
  const hist=[{role:"user",content:coachVideoContext(data,scores)}].concat(history).slice(-8);
  const res=await fetch(COACH_API,{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":"Bearer "+st.userToken},
    body:JSON.stringify({message:String(message).slice(0,800),history:hist,language:currentLanguage})
  });
  if(!res.ok) return null;                             // 401 / 429 / quota / 500 → repli local
  const b=await res.json().catch(()=>({}));
  return (b.reply||"").trim()||null;
}

/* Puces de suggestion : chacune porte l'intention qu'elle vise, au lieu de
   compter sur les mots-clés de sa propre traduction. Sans ce lien explicite, une
   suggestion pouvait renvoyer « je n'ai pas de réponse fiable » — c'était le cas
   de 19 des 56 combinaisons langue × suggestion. */
const COACH_SUGG=[
  {key:"co_q_ctr", intent:"ctr"},
  {key:"co_q_flat",intent:"flat"},
  {key:"co_q_next",intent:"next"},
  {key:"co_q_comp",intent:"comp"}
];

/* Dock permanent : présent sur tous les onglets, replié par défaut. */
function ensureCoachDock(data,scores,checklist){
  const panel=document.getElementById("echo-rank-panel");
  if(!panel || document.getElementById("echoCoachDock")) return;

  const dock=document.createElement("div");
  dock.id="echoCoachDock";
  dock.className="echo-codock";
  dock.innerHTML=`
    <button class="echo-codock-bar" id="coachDockBar" aria-expanded="false" aria-controls="coachDockBody">
      <span class="echo-co-spark">✦</span>
      <span class="echo-codock-title">${T("co_chat")}</span>
      <span class="echo-codock-caret">⌃</span>
    </button>
    <div class="echo-codock-body" id="coachDockBody" hidden>
      <div class="echo-codock-log" id="coachDockLog" aria-live="polite"></div>
      <div class="echo-codock-sugg">
        ${COACH_SUGG.map(sg=>`<button class="echo-co-chip is-q" data-q="${esc(T(sg.key))}" data-intent="${sg.intent}">${T(sg.key)}</button>`).join("")}
      </div>
      <form class="echo-codock-form" id="coachDockForm">
        <input id="coachDockInput" type="text" autocomplete="off" placeholder="${esc(T("co_chat_ph"))}" aria-label="${esc(T("co_chat_ph"))}">
        <button type="submit" aria-label="${esc(T("co_chat_send"))}">↑</button>
      </form>
    </div>`;
  panel.appendChild(dock);

  const bar=dock.querySelector("#coachDockBar");
  const body=dock.querySelector("#coachDockBody");
  const log=dock.querySelector("#coachDockLog");

  const say=(role,html)=>{
    const m=document.createElement("div");
    m.className="echo-comsg "+role;
    m.innerHTML=html;
    log.appendChild(m);
    log.scrollTop=log.scrollHeight;
    return m;
  };
  const bindGo=()=>{
    log.querySelectorAll(".coach-dock-go:not([data-bound])").forEach(b=>{
      b.setAttribute("data-bound","1");
      b.addEventListener("click",()=>{
        if(b.dataset.key && !coachFixDone.includes(b.dataset.key)) coachFixDone.push(b.dataset.key);
        switchTab(b.dataset.goto,data,scores,checklist);
        if(b.dataset.run) setTimeout(()=>document.getElementById(b.dataset.run)?.click(),180);
      });
    });
  };
  const chipsHtml=chips=>chips.length?`<div class="echo-comsg-acts">${chips.map(c=>
    `<button class="echo-co-chip is-go coach-dock-go" data-goto="${c.goto}" data-run="${c.run||''}" data-key="${c.key||''}">${esc(c.label)} →</button>`).join("")}</div>`:"";

  /* Historique de la conversation, borné côté serveur aux 8 derniers tours.
     Nommé chatHistory et non history : ce dernier est un objet global du
     navigateur, le masquer prête à confusion à la lecture. */
  const chatHistory=[];

  const ask=async(q,intent)=>{
    if(!q) return;
    say("me",esc(q));
    chatHistory.push({role:"user",content:q});

    /* Les boutons d'action restent calculés localement : ils dépendent des
       mesures de la vidéo, pas du texte du modèle, et doivent donc rester
       exacts quelle que soit la réponse rédigée. */
    const local=coachAnswer(q,data,scores,checklist,intent);

    const pending=say("bot",`<div class="echo-co-typing" role="status" aria-live="polite"><span></span><span></span><span></span></div>`);
    let reply=null;
    try{ reply=await coachChatAI(q,chatHistory,data,scores); }catch(e){ reply=null; }

    if(reply){
      pending.innerHTML=reply.split(/\n+/).filter(Boolean).map(l=>`<p>${esc(l)}</p>`).join("")+chipsHtml(local.chips);
      chatHistory.push({role:"assistant",content:reply});
    }else{
      /* Repli : réponse composée à partir des mesures réelles, traduite. */
      pending.innerHTML=local.lines.map(l=>`<p>${esc(l)}</p>`).join("")+chipsHtml(local.chips);
      chatHistory.push({role:"assistant",content:local.lines.join(" ")});
    }
    log.scrollTop=log.scrollHeight;
    bindGo();
  };

  dock.__ask=ask;
  dock.__open=()=>{
    if(!body.hidden) return;
    body.hidden=false;
    bar.setAttribute("aria-expanded","true");
    dock.classList.add("is-open");
    if(!log.children.length) say("bot",`<p>${esc(T("co_chat_hi"))}</p>`);
    setTimeout(()=>dock.querySelector("#coachDockInput")?.focus(),60);
  };
  dock.__close=()=>{ body.hidden=true; bar.setAttribute("aria-expanded","false"); dock.classList.remove("is-open"); };

  bar.addEventListener("click",()=>{ body.hidden?dock.__open():dock.__close(); });
  /* Échap referme le dock depuis n'importe quel champ qu'il contient. */
  dock.addEventListener("keydown",e=>{ if(e.key==="Escape" && !body.hidden){ dock.__close(); bar.focus(); } });
  dock.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>ask(b.dataset.q,b.dataset.intent||undefined)));
  dock.querySelector("#coachDockForm").addEventListener("submit",e=>{
    e.preventDefault();
    const inp=dock.querySelector("#coachDockInput");
    const v=(inp.value||"").trim();
    if(!v) return;
    inp.value="";
    ask(v);
  });
}

function openCoachChat(data,scores,checklist){
  ensureCoachDock(data,scores,checklist);
  document.getElementById("echoCoachDock")?.__open?.();
}

/* ══════════════════════════════════════════════════════════════
   🚀 PUBLICATION · 📊 SUIVI · 📈 CROISSANCE
   ──────────────────────────────────────────────────────────────
   Suite du parcours du Coach, même langage visuel (echo-co-*) et même règle :
   tout chiffre affiché est mesuré (DOM de la page, pixels de la miniature, ou
   API YouTube réelle via /activation/youtube/*). Ce qui n'est pas mesurable est
   étiqueté « Indisponible » — jamais estimé, jamais tiré au hasard.
══════════════════════════════════════════════════════════════ */

/* Description complète depuis le DOM. getVideoData() la tronque à 600 caractères
   pour l'IA ; les vérifications de publication (hashtags, liens, chapitres) sont
   souvent en fin de description, il faut donc le texte entier. */
function fullDescription(){
  const el=document.querySelector("#description-inline-expander,#description ytd-text-inline-expander");
  return (el && el.innerText) ? el.innerText : "";
}

/* Durée ISO 8601 de l'API YouTube (PT1H2M3S) → secondes. */
function iso8601Seconds(d){
  const m=/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d||"");
  if(!m) return null;
  return (+m[1]||0)*86400+(+m[2]||0)*3600+(+m[3]||0)*60+(+m[4]||0);
}
function fmtDuration(sec){
  if(sec==null) return T("wf_na");
  const h=Math.floor(sec/3600), mn=Math.floor((sec%3600)/60), s=sec%60;
  return (h?h+":"+String(mn).padStart(2,"0"):String(mn))+":"+String(s).padStart(2,"0");
}
/* Ancienneté lisible à partir d'une vraie durée écoulée. */
function humanAgo(ms){
  if(ms==null||!isFinite(ms)||ms<0) return T("wf_na");
  const min=Math.floor(ms/60000), h=Math.floor(min/60), d=Math.floor(h/24);
  const n = d>=1 ? d+" "+T("wf_d") : h>=1 ? h+" "+T("wf_h") : Math.max(1,min)+" "+T("co_min");
  return T("wf_ago").replace("{n}",n);
}

/* Câble les boutons « → » d'un bloc injecté après coup (setContent ne rejoue pas
   les écouteurs posés par bindTabEvents). Ne touche pas à la progression du
   Coach : ces écrans ouvrent un outil, ils ne valident pas une correction. */
function bindWorkflowGoto(root,data,scores,checklist){
  if(!root) return;
  root.querySelectorAll(".wf-goto:not([data-bound])").forEach(b=>{
    b.setAttribute("data-bound","1");
    b.addEventListener("click",()=>{
      switchTab(b.dataset.goto,data,scores,checklist);
      if(b.dataset.run) setTimeout(()=>document.getElementById(b.dataset.run)?.click(),180);
    });
  });
}
/* Boutons « Copier » : le contenu à copier est passé en data-copy. */
function bindWorkflowCopy(root){
  if(!root) return;
  root.querySelectorAll(".wf-copy:not([data-bound])").forEach(b=>{
    b.setAttribute("data-bound","1");
    b.addEventListener("click",()=>{
      const txt=b.dataset.copy||"";
      if(!txt) return;
      navigator.clipboard.writeText(txt).then(()=>{
        const old=b.textContent;
        b.textContent="✓ "+T("pb_copied");
        setTimeout(()=>{ b.textContent=old; },1500);
      }).catch(()=>showToast(T("wf_na")));
    });
  });
}

/* Ligne de vérification / de levier, au format des lignes du Coach.
   status : "ok" | "fix" | "na" — « na » ne compte ni en réussite ni en échec. */
function wfRow(r){
  const mark = r.status==="ok" ? "✓" : r.status==="na" ? "·" : "🔴";
  const cls  = r.status==="ok" ? "is-done" : r.status==="na" ? "is-na" : "";
  return `
    <div class="echo-co-row ${cls}">
      <span class="echo-co-rank">${mark}</span>
      <div class="echo-co-body">
        <div class="echo-co-title">${r.icon?r.icon+" ":""}${esc(r.label)}</div>
        ${r.meta?`<div class="echo-co-meta">${esc(r.meta)}</div>`:""}
        ${r.why?`<div class="echo-co-why">${esc(r.why)}</div>`:""}
      </div>
      ${r.goto?`<button class="echo-co-go wf-goto" data-goto="${r.goto}" data-run="${r.run||''}"
                aria-label="${esc(T("co_fix"))} — ${esc(r.label)}">${T("co_fix")} →</button>`:""}
    </div>`;
}
/* Grille de valeurs mesurées (réutilise la grille des stats réelles). */
function wfCells(pairs){
  return `<div class="echo-rs-grid">${pairs.map(([v,l])=>
    `<div class="echo-rs-cell"><b>${esc(String(v))}</b><span>${esc(l)}</span></div>`).join("")}</div>`;
}
/* Bloc « Indisponible » assumé : on nomme la donnée absente et on dit pourquoi. */
function wfUnavailable(labels){
  return `
    <section class="echo-co-good">
      <h3 class="echo-co-h">${T("sv_hidden")}</h3>
      <div class="echo-co-chips">${labels.map(l=>`<span class="echo-co-chip is-na">${esc(l)} — ${T("wf_na")}</span>`).join("")}</div>
      <p class="echo-co-lead" style="margin-top:8px">${T("wf_na_note")}</p>
    </section>`;
}

/* ─── 🚀 PUBLICATION ────────────────────────────────────────────
   Contrôle avant publication. Tout est mesuré sur la page ou sur les pixels de
   la miniature ; seuls les tags demandent l'API YouTube (remplis après coup). */
function buildPublishChecks(data,scores,checklist,tags){
  const desc=fullDescription();
  const dLen=desc.length||data.descLength||0;
  const tLen=(data.title||"").length;
  const seo=Math.round(scores.seo||0);
  const rows=[];

  /* Titre : la mesure du Coach + la limite dure de YouTube (100 caractères) */
  const titleOk = seo>=70 && tLen<=100 && tLen>0;
  rows.push({key:"title",icon:"✍️",status:titleOk?"ok":"fix",label:T("pb_c_title"),
    meta:`${tLen} ${T("unit_char")} · ${T("score_seo")} ${seo}/100`,
    why:titleOk?"":T("pb_f_title"),goto:titleOk?null:"titles",run:"btnTitleDoctor"});

  /* Description : longueur réelle du texte présent sur la page */
  rows.push({key:"desc",icon:"📝",status:dLen>=500?"ok":"fix",label:T("pb_c_desc"),
    meta:`${dLen} ${T("unit_char")}`,
    why:dLen>=500?"":T("pb_f_desc"),goto:dLen>=500?null:"titles",run:"btnDescPack"});

  /* Miniature : score mesuré sur les pixels, « Indisponible » si l'image ne l'est pas */
  const th=scores.thumb;
  rows.push({key:"thumb",icon:"🎨",status:th==null?"na":(th>=70?"ok":"fix"),label:T("pb_c_thumb"),
    meta:`${fmtScore(th)}/100`,
    why:th==null?T("th_none"):(th>=70?"":T("pb_f_thumb")),
    goto:(th!=null&&th<70)?"thumbnail":null,run:"btnThumbAI"});

  /* Tags : vraie liste renvoyée par l'API YouTube (null = pas encore lue) */
  rows.push({key:"tags",icon:"🏷️",status:tags==null?"na":(tags.length>=3?"ok":"fix"),label:T("pb_c_tags"),
    meta:tags==null?T("wf_na"):(tags.length?tags.length+"":T("no_tag")),
    why:tags==null?"":(tags.length>=3?"":T("pb_f_tags")),goto:null});

  /* Chapitres / hashtags / liens : mesurés sur le texte réel de la description.
     Sans description lisible on ne conclut pas — statut « na ». */
  if(dLen){
    const stamps=(desc.match(/(?:^|\s)\d{1,2}:\d{2}(?::\d{2})?(?=\s|$)/gm)||[]).length;
    const chapOk=stamps>=3 && /(?:^|\n)\s*0{1,2}:00\b/.test(desc);
    rows.push({key:"chap",icon:"⏱️",status:chapOk?"ok":"fix",label:T("pb_c_chap"),
      /* Pas de bouton : les chapitres se saisissent dans la description côté
         YouTube Studio, et aucun outil de l'extension ne les produit aujourd'hui.
         Mieux vaut aucune action qu'un bouton qui n'ouvre rien. */
      meta:`${stamps}`,why:chapOk?"":T("pb_f_chap"),goto:null});

    const hash=(desc.match(/#[\p{L}\p{N}_]+/gu)||[]).length;
    rows.push({key:"hash",icon:"#️⃣",status:hash>=2?"ok":"fix",label:T("pb_c_hash"),
      meta:`${hash}`,why:hash>=2?"":T("pb_f_hash"),goto:null});

    const links=(desc.match(/https?:\/\/\S+/g)||[]).length;
    rows.push({key:"link",icon:"🔗",status:links>=1?"ok":"fix",label:T("pb_c_link"),
      meta:`${links}`,why:links>=1?"":T("pb_f_link"),goto:null});
  }else{
    ["chap","hash","link"].forEach(k=>rows.push({key:k,status:"na",
      label:T("pb_c_"+k),meta:T("wf_na")}));
  }
  return rows;
}

function renderPublish(data,scores,checklist){
  const rows=buildPublishChecks(data,scores,checklist,publishTags(data.videoId));
  return renderPublishBody(data,scores,rows);
}

/* Tags réels déjà lus pour cette vidéo (null tant que l'API n'a pas répondu). */
const PUBLISH_TAGS=new Map();
function publishTags(videoId){ const v=PUBLISH_TAGS.get(videoId); return v===undefined?null:v; }

function renderPublishBody(data,scores,rows){
  const counted=rows.filter(r=>r.status!=="na");
  const okCount=counted.filter(r=>r.status==="ok").length;
  const total=counted.length;
  const fixes=rows.filter(r=>r.status==="fix");
  const oks=rows.filter(r=>r.status==="ok");
  const nas=rows.filter(r=>r.status==="na");
  const pct=total?Math.max(4,Math.round((okCount/total)*100)):4;
  const desc=fullDescription();
  const tags=publishTags(data.videoId);
  const first=fixes[0]||null;

  return `
    <section class="echo-co-hero" aria-label="${esc(T("pb_hero"))}">
      <div class="echo-co-hero-label">${T("pb_hero")}</div>
      <div class="echo-co-scores" dir="ltr">
        <span class="echo-co-now" style="color:${okCount===total?"#22c55e":"#f7941d"}">${okCount}</span>
        <span class="echo-co-arrow">/</span>
        <span class="echo-co-soon">${total}</span>
      </div>
      <div class="echo-co-track"><div class="echo-co-fill" style="--co-pct:${pct}%"></div></div>
    </section>

    <section class="echo-co-summary" aria-live="polite">
      <!-- Le compte de vérifications est le sujet de l'écran : il tient lieu de
           résumé, sans reprendre le « l'IA a trouvé » du Coach (ici rien n'est
           produit par une IA, tout est mesuré sur la page). -->
      <div class="echo-co-sum-head"><span class="echo-co-spark">✦</span> ${
        fixes.length ? esc(T("pb_ready").replace("{n}",okCount).replace("{m}",total)) : esc(T("pb_all_ok"))}</div>
      ${first?`<p class="echo-co-lead">${esc(first.why||first.label)}</p>`:""}
      ${first&&first.goto
        ?`<button class="echo-co-cta wf-goto" data-goto="${first.goto}" data-run="${first.run||''}">⚡ ${T("co_autofix")}</button>`
        :`<button class="echo-co-cta wf-copy" data-copy="${esc(data.title||"")}">📋 ${T("pb_copy")} — ${T("pb_c_title")}</button>`}
    </section>

    ${fixes.length?`<section class="echo-co-list">
      <h3 class="echo-co-h">${T("co_prio")}</h3>
      ${fixes.map(wfRow).join("")}
    </section>`:""}

    ${oks.length?`<section class="echo-co-list">
      <h3 class="echo-co-h">${T("co_ok")}</h3>
      ${oks.map(wfRow).join("")}
    </section>`:""}

    ${nas.length?`<section class="echo-co-good">
      <h3 class="echo-co-h">${T("wf_na")}</h3>
      <div class="echo-co-chips">${nas.map(r=>`<span class="echo-co-chip is-na">${esc(r.label)}</span>`).join("")}</div>
    </section>`:""}

    <section class="echo-co-list">
      <h3 class="echo-co-h">${T("pb_pack")}</h3>
      <p class="echo-co-lead">${T("pb_pack_hint")}</p>
      <div class="echo-co-chips">
        <button class="echo-co-chip is-go wf-copy" data-copy="${esc(data.title||"")}">${T("pb_copy")} — ${T("pb_c_title")}</button>
        ${desc?`<button class="echo-co-chip is-go wf-copy" data-copy="${esc(desc)}">${T("pb_copy")} — ${T("pb_c_desc")}</button>`:""}
        ${tags&&tags.length?`<button class="echo-co-chip is-go wf-copy" data-copy="${esc(tags.join(", "))}">${T("pb_copy")} — ${T("pb_c_tags")}</button>`:""}
      </div>
    </section>

    <button class="echo-co-tertiary" id="btnFullReport">${T("co_report")}</button>
  `;
}

/* Lit les tags réels (API YouTube) puis reconstruit l'écran avec la vérification
   complète. Un échec laisse la ligne « Indisponible » : on n'invente rien. */
async function loadPublish(data,scores,checklist){
  if(PUBLISH_TAGS.has(data.videoId)) return;
  try{
    const r=await sendBG({action:"yt_video",videoId:data.videoId});
    PUBLISH_TAGS.set(data.videoId,Array.isArray(r&&r.tags)?r.tags:[]);
  }catch(e){ return; }               // reste « Indisponible », sans message d'erreur bloquant
  if(activeTab!=="publish") return;
  const content=document.getElementById("echoTabContent");
  if(!content) return;
  const rows=buildPublishChecks(data,scores,checklist,publishTags(data.videoId));
  content.innerHTML=renderPublishBody(data,scores,rows);
  bindWorkflowGoto(content,data,scores,checklist);
  bindWorkflowCopy(content);
  content.querySelector("#btnFullReport")?.addEventListener("click",openFullReport);
}

/* ─── 📊 SUIVI ──────────────────────────────────────────────────
   Relevés réels stockés sur l'appareil : c'est la seule façon d'avoir une
   évolution sans YouTube Analytics. Chaque delta affiché vient de deux mesures
   réellement enregistrées, jamais d'une extrapolation. */
const TRACK_KEY="vs_track";
function storageGet(key){
  return new Promise(res=>{
    if(!extAlive()) return res({});
    try{ chrome.storage.local.get([key],o=>res(o||{})); }catch(e){ res({}); }
  });
}
function storageSet(obj){
  return new Promise(res=>{
    if(!extAlive()) return res(false);
    try{ chrome.storage.local.set(obj,()=>res(true)); }catch(e){ res(false); }
  });
}
/* Ajoute un relevé (max 12 par vidéo, 40 vidéos) et renvoie l'historique complet.
   Un relevé de moins de 30 min n'est pas dupliqué : deux ouvertures d'affilée ne
   doivent pas produire un faux « +0 vue depuis ton dernier relevé ». */
async function trackSnapshot(videoId,rec){
  const all=(await storageGet(TRACK_KEY))[TRACK_KEY]||{};
  const list=Array.isArray(all[videoId])?all[videoId]:[];
  const last=list[list.length-1];
  if(!last || (rec.t-last.t)>30*60*1000){
    list.push(rec);
    while(list.length>12) list.shift();
    all[videoId]=list;
    const ids=Object.keys(all);
    if(ids.length>40) delete all[ids[0]];
    await storageSet({[TRACK_KEY]:all});
  }
  return list;
}

function renderTrack(data,scores){
  /* En Free l'écran est verrouillé et aucun chargement n'est lancé : afficher un
     spinner qui tournerait indéfiniment sous le voile serait mensonger. */
  const idle=currentPlan==="free";
  return `
    <div id="card-track">${idle?`<div class="echo-co-summary"><div class="echo-co-sum-head">${esc(T("sv_hero"))}</div></div>`:spinnerHTML(T("sv_load"))}</div>
    ${idle?"":`<button class="echo-co-tertiary" id="btnTrackRefresh">${T("wf_refresh")}</button>`}
  `;
}

async function loadTrack(data,scores,checklist){
  setContent("card-track",spinnerHTML(T("sv_load")));
  let r=null;
  /* fresh:true — le service worker met yt_video en cache 24 h, ce qui est bon pour
     les autres écrans mais faux pour un écran de suivi : on exige la lecture du jour. */
  try{ r=await sendBG({action:"yt_video",videoId:data.videoId,fresh:true}); }
  catch(e){ setContent("card-track",`<div class="echo-co-summary"><div class="echo-co-sum-head">${esc(T("sv_none"))}</div><p class="echo-co-lead">${esc(e.message||"")}</p></div>`); return; }
  if(!r){ setContent("card-track",errHTML(T("sv_none"))); return; }

  const views=+r.views||0, likes=+r.likes||0, comments=+r.comments||0;
  const pubMs=r.published_at?Date.parse(r.published_at):NaN;
  const ageMs=isFinite(pubMs)?Date.now()-pubMs:null;
  const days=ageMs?Math.max(1,ageMs/86400000):null;
  const perDay=days?Math.round(views/days):null;
  const durSec=iso8601Seconds(r.duration);

  /* Historique local : delta réel entre deux relevés enregistrés */
  const hist=await trackSnapshot(data.videoId,{t:Date.now(),views,likes,comments});
  const prev=hist.length>1?hist[hist.length-2]:null;
  let deltaBlock="";
  if(prev){
    const dv=views-prev.views, dl=likes-prev.likes, dc=comments-prev.comments;
    const dtDays=Math.max(1/24,(Date.now()-prev.t)/86400000);
    const speed=Math.round(dv/dtDays);
    deltaBlock=`
      <section class="echo-co-list">
        <h3 class="echo-co-h">${T("sv_delta")} · ${esc(humanAgo(Date.now()-prev.t))}</h3>
        ${wfCells([[(dv>=0?"+":"")+fmtNum(dv),T("stat_views")],
                   [(dl>=0?"+":"")+fmtNum(dl),T("stat_likes")],
                   [(dc>=0?"+":"")+fmtNum(dc),T("stat_comments")]])}
        <p class="echo-co-lead" style="margin-top:8px">${fmtNum(speed)} ${esc(T("sv_speed"))}</p>
      </section>`;
  }else{
    deltaBlock=`<section class="echo-co-list"><h3 class="echo-co-h">${T("sv_delta")}</h3>
      <p class="echo-co-lead">${esc(T("sv_first"))}</p></section>`;
  }

  /* Comparaison à la moyenne réelle de la chaîne (2ᵉ appel, facultatif) */
  let vsBlock="";
  try{
    const cid=r.channel_id||extractYouTubeChannelId();
    if(cid){
      const a=await sendBG({action:"channel_audit",channelId:cid});
      const avg=+((a||{}).avg_views)||0;
      if(avg>0){
        const ratio=Math.round((views/avg)*100);
        const verdict=ratio>=115?T("sv_above"):ratio<=85?T("sv_below"):T("sv_equal");
        vsBlock=`
          <section class="echo-co-summary">
            <div class="echo-co-sum-head"><span class="echo-co-spark">✦</span> ${ratio}% — ${esc(verdict)}</div>
            <p class="echo-co-lead">${fmtNum(views)} ${esc(T("stat_views"))} · ${fmtNum(avg)} ${esc(T("stat_avg_views"))} — ${esc(T("sv_vs"))}</p>
            ${ratio<=85?`<button class="echo-co-cta wf-goto" data-goto="thumbnail" data-run="btnThumbAI">⚡ ${T("co_a_thumb")}</button>`:""}
          </section>`;
      }
    }
  }catch(e){ /* comparaison facultative : son absence n'invalide pas le reste */ }

  setContent("card-track",`
    <section class="echo-co-hero" aria-label="${esc(T("sv_hero"))}">
      <div class="echo-co-hero-label">${T("sv_hero")}</div>
      <div class="echo-co-scores" dir="ltr"><span class="echo-co-now">${fmtNum(views)}</span></div>
      <div class="echo-co-hero-sub" style="gap:16px"><span>${esc(T("stat_views"))}</span>${
        ageMs!=null?`<span>${esc(T("sv_age").replace("{ago}",humanAgo(ageMs)))}</span>`:""}</div>
      <div class="echo-co-hero-meta">${perDay!=null?fmtNum(perDay)+" "+esc(T("stat_views"))+"/"+esc(T("wf_d")):esc(T("wf_na"))} · ${fmtNum(r.views_per_hour)}/${esc(T("wf_h"))}</div>
    </section>
    ${vsBlock}
    <section class="echo-co-list">
      ${wfCells([[fmtNum(likes),T("stat_likes")],[fmtNum(comments),T("stat_comments")],
                 [(r.engagement_rate??0)+"%",T("stat_engagement")],[fmtNum(r.channel_subs),T("stat_subs")],
                 [fmtDuration(durSec),T("pb_dur")],[fmtNum(r.channel_videos),T("stat_total_vids")]])}
      <!-- Affiché seulement à partir de 2 relevés : « 1 relevés » serait fautif dans
           plusieurs langues, et le cas d'un seul relevé est déjà dit par sv_first. -->
      ${hist.length>1?`<p class="echo-co-lead" style="margin-top:8px">${T("sv_snaps").replace("{n}",hist.length)}</p>`:""}
    </section>
    ${deltaBlock}
    ${wfUnavailable([T("overview_ctr_label")])}
  `);
  const card=document.getElementById("card-track");
  bindWorkflowGoto(card,data,scores,checklist);
}

/* ─── 📈 CROISSANCE ─────────────────────────────────────────────
   Photo réelle de la chaîne (API YouTube) puis leviers déduits de ces chiffres.
   Chaque levier cite la valeur mesurée qui le déclenche. */
function renderGrowth(data,scores){
  const tools=[["trends","🔥",T("nav_trends")],["planner","📅",T("nav_planner")],
               ["ideas","💡",T("nav_ideas")],["region","🌍",T("nav_region")],
               ["revenue","💰",T("nav_revenue")],["sponsor","💼",T("nav_sponsor")]];
  const idle=currentPlan==="free";
  return `
    <div id="card-growth">${idle?`<div class="echo-co-summary"><div class="echo-co-sum-head">${esc(T("gr_hero"))}</div></div>`:spinnerHTML(T("gr_load"))}</div>
    <section class="echo-co-list">
      <h3 class="echo-co-h">${T("gr_tools")}</h3>
      <div class="echo-co-chips">
        ${tools.map(([id,ic,label])=>`<button class="echo-co-chip is-go wf-goto" data-goto="${id}">${ic} ${esc(label)} →</button>`).join("")}
      </div>
    </section>
  `;
}

/* Leviers de croissance : uniquement des règles sur des valeurs mesurées. */
function buildGrowthLevers(a,videoViews){
  const L=[];
  const freq=+a.upload_freq_days||0;
  if(freq>10) L.push({icon:"📅",status:"fix",label:T("gr_a_cadence"),
    why:T("gr_w_cadence").replace("{v}",freq),meta:`${freq} ${T("wf_d")}`,goto:"planner"});
  const tagPct=a.tags_usage_pct;
  if(tagPct!=null && tagPct<70) L.push({icon:"🏷️",status:"fix",label:T("gr_a_tags"),
    why:T("gr_w_tags").replace("{v}",tagPct),meta:`${tagPct}%`,goto:"seo"});
  const eng=a.avg_engagement;
  if(eng!=null && eng<2) L.push({icon:"💬",status:"fix",label:T("gr_a_engage"),
    why:T("gr_w_engage").replace("{v}",eng),meta:`${eng}%`,goto:"comments"});
  const avg=+a.avg_views||0;
  if(videoViews!=null && avg>0){
    const ratio=Math.round((videoViews/avg)*100);
    if(ratio<85) L.push({icon:"📉",status:"fix",label:T("gr_a_under"),
      why:T("gr_w_under").replace("{v}",ratio),meta:`${ratio}%`,goto:"thumbnail",run:"btnThumbAI"});
  }
  if(a.worst_video&&a.worst_video.title) L.push({icon:"♻️",status:"fix",label:T("gr_a_worst"),
    why:T("gr_w_worst").replace("{v}",String(a.worst_video.title).slice(0,60)),
    meta:fmtNum(a.worst_video.views)+" "+T("stat_views"),goto:"titles",run:"btnTitleDoctor"});
  return L;
}

async function loadGrowth(data,scores,checklist){
  setContent("card-growth",spinnerHTML(T("gr_load")));
  let videoViews=null, cid=extractYouTubeChannelId();
  try{
    const v=await sendBG({action:"yt_video",videoId:data.videoId});
    if(v){ videoViews=+v.views||0; cid=cid||v.channel_id; }
  }catch(e){ /* les vues de la vidéo ne sont qu'un des leviers */ }

  if(!cid){ setContent("card-growth",errHTML(T("gr_none"))); return; }
  let a=null;
  try{ a=await sendBG({action:"channel_audit",channelId:cid}); }
  catch(e){ setContent("card-growth",`<div class="echo-co-summary"><div class="echo-co-sum-head">${esc(T("gr_none"))}</div><p class="echo-co-lead">${esc(e.message||"")}</p></div>`); return; }
  if(!a){ setContent("card-growth",errHTML(T("gr_none"))); return; }

  const levers=buildGrowthLevers(a,videoViews);
  setContent("card-growth",`
    <section class="echo-co-hero" aria-label="${esc(T("gr_hero"))}">
      <div class="echo-co-hero-label">${T("gr_hero")}${a.channel?" — "+esc(String(a.channel).slice(0,28)):""}</div>
      <div class="echo-co-scores" dir="ltr"><span class="echo-co-now">${fmtNum(a.subs)}</span></div>
      <div class="echo-co-hero-sub" style="gap:16px"><span>${esc(T("stat_subs"))}</span></div>
      <div class="echo-co-hero-meta">${fmtNum(a.avg_views)} ${esc(T("stat_avg_views"))} · ${fmtNum(a.total_videos)} ${esc(T("stat_total_vids"))}</div>
    </section>

    <section class="echo-co-summary">
      <!-- Le résumé nomme le levier dominant plutôt que d'annoncer un nombre de
           « trouvailles » : chaque levier vient d'un seuil mesuré sur la chaîne. -->
      <div class="echo-co-sum-head"><span class="echo-co-spark">✦</span> ${
        levers.length?esc(levers[0].label):esc(T("gr_ok"))}</div>
      ${levers.length?`<p class="echo-co-lead">${esc(levers[0].why)}</p>
        <button class="echo-co-cta wf-goto" data-goto="${levers[0].goto}" data-run="${levers[0].run||''}">⚡ ${T("co_autofix")}</button>`:""}
    </section>

    <section class="echo-co-list">
      <h3 class="echo-co-h">${T("nav_channel")}</h3>
      ${wfCells([[fmtNum(a.avg_views),T("stat_avg_views")],
                 [(a.avg_engagement??0)+"%",T("stat_engagement")],
                 [a.upload_freq_days?a.upload_freq_days+" "+T("wf_d"):T("wf_na"),T("stat_freq")],
                 [(a.tags_usage_pct??0)+"%",T("stat_tagged")],
                 [fmtNum(a.total_videos),T("stat_total_vids")],
                 [fmtNum(a.total_views),T("stat_views")]])}
      ${a.best_video&&a.best_video.title?`<p class="echo-co-lead" style="margin-top:8px">🏆 ${esc(String(a.best_video.title).slice(0,50))} — ${fmtNum(a.best_video.views)} ${esc(T("stat_views"))}</p>`:""}
    </section>

    ${levers.length?`<section class="echo-co-list">
      <h3 class="echo-co-h">${T("gr_next")}</h3>
      ${levers.map(wfRow).join("")}
    </section>`:""}
  `);
  const card=document.getElementById("card-growth");
  bindWorkflowGoto(card,data,scores,checklist);
}

function renderTabContent(tab,data,scores,checklist){
  const free = currentPlan==="free";
  if(free && freeLimitReached) return renderFreeLimitPanel();
  switch(tab){
    case "coach":      return renderCoach(data,scores,checklist);
    /* Suite du parcours : Publication → Suivi → Croissance */
    case "publish":    return free ? lockedFeature(renderPublish(data,scores,checklist),"🚀 "+T("nav_publish")) : renderPublish(data,scores,checklist);
    case "track":      return free ? lockedFeature(renderTrack(data,scores),"📊 "+T("nav_track")) : renderTrack(data,scores);
    case "growth":     return free ? lockedFeature(renderGrowth(data,scores),"📈 "+T("nav_growth")) : renderGrowth(data,scores);
    case "overview":   return free ? renderOverviewFree(data,scores) : renderOverview(data,scores,checklist);
    case "seo":        return free ? lockedFeature(renderSEO(data,scores,checklist),"🔍 "+T("nav_seo")) : renderSEO(data,scores,checklist);
    case "thumbnail":  return free ? lockedFeature(renderThumbnail(data,scores),"🖼️ "+T("nav_thumbnail")) : renderThumbnail(data,scores);
    case "viral":      return free ? lockedFeature(renderViral(data,scores),"🔥 "+T("nav_viral")) : renderViral(data,scores);
    case "competitor": return free ? lockedFeature(renderCompetitor(data,scores),"📊 "+T("nav_competitor")) : renderCompetitor(data,scores);
    case "titles":     return renderTitles(data);
    case "abtest":     return free ? lockedFeature(renderABTest(data),"⚔️ A/B Test") : renderABTest(data);
    case "shorts":     return renderShorts(data);
    case "region":     return free ? lockedFeature(renderAudience(),"🌍 "+T("nav_region")) : renderAudience();
    case "revenue":    return free ? lockedFeature(renderRevenue(data),"💰 "+T("nav_revenue")) : renderRevenue(data);
    case "sponsor":    return free ? lockedFeature(renderSponsor(),"💼 "+T("nav_sponsor")) : renderSponsor();
    case "channel":    return free ? lockedFeature(renderChannel(),"📊 "+T("nav_channel")) : renderChannel();
    case "comments":   return free ? lockedFeature(renderComments(),"💬 "+T("nav_comments")) : renderComments();
    case "ideas":      return free ? lockedFeature(renderIdeas(),"💡 "+T("nav_ideas")) : renderIdeas();
    case "tiktok":     return free ? lockedFeature(renderTikTok(),"🎵 TikTok") : renderTikTok();
    case "planner":    return free ? lockedFeature(renderPlanner(),"📅 "+T("nav_planner")) : renderPlanner();
    case "trends":     return free ? lockedFeature(renderTrends(),"🔥 "+T("nav_trends")) : renderTrends();
    case "actions":    return free ? lockedFeature(renderActions(data),"⚡ "+T("nav_actions")) : renderActions(data);
    default:           return free ? renderOverviewFree(data,scores) : renderOverview(data,scores,checklist);
  }
}

/* Aperçu GRATUIT : score global + sous-scores visibles, corrections verrouillées */
function renderOverviewFree(data,scores){
  const global=scores.global||computeGlobalScore(scores.seo,scores.viral,scores.thumb);
  const gc=scoreColor(global), sc=scoreColor(scores.seo), vc=scoreColor(scores.viral), tc=scoreColor(scores.thumb);
  const ctr=scores.ctr||computeCTR(scores.seo,scores.viral,scores.thumb);
  return `
    <div class="echo-global-score-wrap">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle cx="40" cy="40" r="32" fill="none" stroke="#1a1a1a" stroke-width="6"/>
        <circle cx="40" cy="40" r="32" fill="none" stroke="${gc}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${Math.round(global*2.01)} 201" stroke-dashoffset="50" transform="rotate(-90 40 40)"/>
        <text x="40" y="37" text-anchor="middle" font-size="16" font-weight="800" fill="${gc}">${global}</text>
        <text x="40" y="50" text-anchor="middle" font-size="8" fill="#555">/ 100</text>
      </svg>
      <div class="echo-global-info">
        <div class="echo-global-label">${T("score_global")}</div>
        <div class="echo-global-ctr">${T("overview_ctr_label")} : <span style="color:#7c6dfa;font-weight:700">${ctr}%</span></div>
      </div>
    </div>
    <div class="echo-scores-row">
      <div class="echo-score-pill" style="border-color:${sc}"><div class="echo-score-num" style="color:${sc}">${scores.seo}</div><div class="echo-score-pill-label">${T("score_seo")}</div></div>
      <div class="echo-score-pill" style="border-color:${vc}"><div class="echo-score-num" style="color:${vc}">${scores.viral}</div><div class="echo-score-pill-label">${T("score_viral")}</div></div>
      <div class="echo-score-pill" style="border-color:${tc}"><div class="echo-score-num" style="color:${tc}">${fmtScore(scores.thumb)}</div><div class="echo-score-pill-label">${T("score_thumb")}</div></div>
    </div>
    ${lockedFeature(`
      <div class="echo-card">
        <div class="echo-card-head">${T("checklist_title")}</div>
        <div class="echo-check-row"><span class="echo-check-dot fix"></span><div style="flex:1"><span class="echo-check-text">${T("gate_feat1")}</span></div></div>
        <div class="echo-check-row"><span class="echo-check-dot fix"></span><div style="flex:1"><span class="echo-check-text">${T("gate_feat2")}</span></div></div>
        <div class="echo-check-row"><span class="echo-check-dot ok"></span><div style="flex:1"><span class="echo-check-text">${T("gate_feat3")}</span></div></div>
      </div>`, T("gate_unlock"))}
  `;
}

function switchTab(tab,data,scores,checklist){
  activeTab=tab;
  activeSection=sectionOf(tab);
  rebuildNav(data,scores,checklist);
  const content=document.getElementById("echoTabContent");
  if(content){
    content.classList.add("echo-fading");
    setTimeout(()=>{
      content.innerHTML=renderTabContent(tab,data,scores,checklist);
      bindTabEvents(tab,data,scores,checklist);
      content.classList.remove("echo-fading");
    },90);
  }
}
function switchSection(sid,data,scores,checklist){
  const s=SECTIONS.find(x=>x.id===sid);
  if(s) switchTab(s.tabs[0],data,scores,checklist);
}
/* Reconstruit les 2 barres (sections + sous-onglets) et rebinde leurs clics */
function rebuildNav(data,scores,checklist){
  const sb=document.getElementById("echoSectionBar");
  const tb=document.getElementById("echoSubTabBar");

  /* Navigation au clavier dans une barre d'onglets : ←/→ pour se déplacer,
     Début/Fin pour aller aux extrémités. Absente jusqu'ici, ce qui rendait le
     panneau inutilisable sans souris. */
  const wireKeys=(bar,act)=>{
    const items=[...bar.querySelectorAll("[role='tab']")];
    items.forEach((b,i)=>{
      b.tabIndex = b.classList.contains("active") ? 0 : -1;
      b.addEventListener("keydown",e=>{
        let n=-1;
        if(e.key==="ArrowRight"||e.key==="ArrowDown") n=(i+1)%items.length;
        else if(e.key==="ArrowLeft"||e.key==="ArrowUp") n=(i-1+items.length)%items.length;
        else if(e.key==="Home") n=0;
        else if(e.key==="End") n=items.length-1;
        else return;
        e.preventDefault();
        items[n].focus();
        act(items[n]);
      });
    });
  };

  if(sb){
    sb.innerHTML=SECTIONS.map(s=>`<button class="echo-tab-btn ${s.id===activeSection?"active":""}" role="tab" aria-selected="${s.id===activeSection}" data-section="${s.id}">${s.icon} ${T(s.key)}</button>`).join("");
    sb.querySelectorAll("[data-section]").forEach(b=>b.addEventListener("click",()=>switchSection(b.dataset.section,data,scores,checklist)));
    wireKeys(sb,b=>switchSection(b.dataset.section,data,scores,checklist));
    /* Fait défiler l'onglet actif dans la vue : la barre peut déborder à 400px
       et la barre de défilement est masquée, l'actif restait invisible. */
    sb.querySelector(".echo-tab-btn.active")?.scrollIntoView({block:"nearest",inline:"nearest"});
  }
  if(tb){
    const subs=(SECTIONS.find(s=>s.id===activeSection)?.tabs||[]).filter(t=>t!=="coach");
    tb.innerHTML=subs.map(tab=>`<button class="echo-tab-btn echo-subtab ${tab===activeTab?"active":""}" role="tab" aria-selected="${tab===activeTab}" data-tab="${tab}">${T("nav_"+tab)}</button>`).join("");
    tb.style.display=subs.length?"":"none";
    tb.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab,data,scores,checklist)));
    wireKeys(tb,b=>switchTab(b.dataset.tab,data,scores,checklist));
    tb.querySelector(".echo-tab-btn.active")?.scrollIntoView({block:"nearest",inline:"nearest"});
  }
}

/* ── Bind global panel events ── */
function bindPanelEvents(panel,data,scores,checklist){
  /* 🔑 Changer de code / réactiver (efface l'activation et recharge) */
  panel.querySelector("#btnReactivate")?.addEventListener("click",async()=>{
    if(!confirm(T("reactivate_confirm"))) return;
    // 🔓 Libérer le code côté serveur (débloque l'appareil)
    try{
      const st=await chrome.storage.local.get(['activation_id','activation_secret','device_id']);
      if(st.activation_id && st.activation_secret){
        await fetch('https://vidspark-ai-production-9ac7.up.railway.app/api/activation/release',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({activation_id:st.activation_id,activation_secret:st.activation_secret,device_id:st.device_id})
        });
      }
    }catch(e){ /* on déconnecte quand même localement */ }
    chrome.storage.local.remove(['activation_id','activation_secret','subscription_expiry','authorizedChannelIds','lockedChannelName','userToken','userEmail','userPlan'],()=>location.reload());
  });
  /* 👤 Menu compte — il n'avait AUCUN gestionnaire : le menu restait `hidden`,
     donc le sélecteur de langue et la réactivation de code étaient inatteignables
     depuis que ces deux réglages ont quitté la barre d'en-tête. */
  const acctBtn=panel.querySelector("#echoAcctBtn");
  const acctMenu=panel.querySelector("#echoAcctMenu");
  if(acctBtn&&acctMenu){
    const setOpen=open=>{
      acctMenu.hidden=!open;
      acctBtn.setAttribute("aria-expanded",String(open));
      if(open) setTimeout(()=>acctMenu.querySelector("select,button,a")?.focus(),40);
    };
    acctBtn.addEventListener("click",e=>{ e.stopPropagation(); setOpen(acctMenu.hidden); });
    /* Fermeture : Échap depuis le menu, clic en dehors, ou choix d'un élément. */
    acctMenu.addEventListener("keydown",e=>{ if(e.key==="Escape"){ setOpen(false); acctBtn.focus(); } });
    acctBtn.addEventListener("keydown",e=>{ if(e.key==="Escape") setOpen(false); });
    acctMenu.querySelectorAll(".echo-acct-item").forEach(el=>el.addEventListener("click",()=>setOpen(false)));
    document.addEventListener("click",e=>{
      if(!acctMenu.hidden && !acctMenu.contains(e.target) && e.target!==acctBtn) setOpen(false);
    });
  }

  /* langue */
  panel.querySelector("#echoLangSelect").addEventListener("change",function(){
    currentLanguage=this.value;
    chrome.storage.local.set({echoLanguage:currentLanguage});
    panelMounted=false; currentVideoId=null;
    createPanel();
    showToast(T("lang_changed")+" : "+LANG_LIST.find(l=>l.code===currentLanguage)?.label);
  });

  /* nav à 2 niveaux : 5 sections + sous-onglets */
  rebuildNav(data,scores,checklist);

  bindTabEvents(activeTab,data,scores,checklist);
  /* Coach conversationnel : dock permanent, hors de #echoTabContent pour survivre
     aux changements d'onglet. Replié par défaut, jamais reconstruit. */
  ensureCoachDock(data,scores,checklist);
  showOnboarding();
}

/* Visite guidée au 1er lancement (une seule fois) */
function showOnboarding(){
  if(document.getElementById("echo-onboard")) return;
  chrome.storage.local.get("vidspark_onboarded",r=>{
    if(r.vidspark_onboarded) return;
    const rtl=currentLanguage==="ar";
    const ov=document.createElement("div");
    ov.id="echo-onboard";
    ov.style.cssText="position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;";
    ov.innerHTML=`<div dir="${rtl?'rtl':'ltr'}" style="background:#0e0e12;border:1px solid #2a2a35;border-radius:14px;max-width:340px;width:90%;padding:20px;color:#e8e8f0;font-family:system-ui,sans-serif;">
      <div style="font-size:18px;font-weight:800;margin-bottom:4px;">👋 ${esc(T("ob_title"))}</div>
      <div style="font-size:12px;color:#888;margin-bottom:14px;">${esc(T("ob_sub"))}</div>
      <div style="display:flex;flex-direction:column;gap:9px;font-size:12px;line-height:1.4;">
        <div>⚡ <b>${esc(T("au_section"))}</b> — ${esc(T("ob_audit"))}</div>
        <div>🩺 <b>${esc(T("td_title"))}</b> — ${esc(T("ob_title2"))}</div>
        <div>📸 <b>${esc(T("thumbab_title"))}</b> — ${esc(T("ob_thumb"))}</div>
        <div>🎬 <b>${esc(T("nav_shorts"))}</b> — ${esc(T("ob_shorts"))}</div>
        <div>💼 <b>${esc(T("nav_sponsor"))}</b> — ${esc(T("ob_sponsor"))}</div>
      </div>
      <button id="echo-ob-close" class="echo-action-btn purple" style="margin-top:16px;">${esc(T("ob_btn"))}</button>
    </div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click",e=>{ if(e.target===ov){ chrome.storage.local.set({vidspark_onboarded:true}); ov.remove(); } });
    ov.querySelector("#echo-ob-close").addEventListener("click",()=>{ chrome.storage.local.set({vidspark_onboarded:true}); ov.remove(); });
  });
}

/* ── Bind events spécifiques à chaque onglet ── */
function bindTabEvents(tab,data,scores,checklist){
  const content=document.getElementById("echoTabContent");
  if(!content)return;

  /* 🧠 Coach : le Coach ouvre l'outil ET le déclenche — l'utilisateur ne cherche pas. */
  const coachLaunch=(goto,run,key)=>{
    if(key && !coachFixDone.includes(key)) coachFixDone.push(key);
    switchTab(goto,data,scores,checklist);
    if(run) setTimeout(()=>document.getElementById(run)?.click(),180);
  };
  content.querySelectorAll(".coach-goto").forEach(btn=>{
    btn.addEventListener("click",()=>coachLaunch(btn.dataset.goto,btn.dataset.run,btn.dataset.key));
  });

  /* 🚀📊📈 Publication / Suivi / Croissance : mêmes lignes que le Coach, plus les
     boutons « Copier ». L'analyse se lance seule à l'ouverture de l'onglet —
     l'utilisateur n'a aucun bouton à chercher. */
  bindWorkflowGoto(content,data,scores,checklist);
  bindWorkflowCopy(content);
  if(currentPlan!=="free"){
    if(tab==="publish") loadPublish(data,scores,checklist);
    if(tab==="track")   loadTrack(data,scores,checklist);
    if(tab==="growth")  loadGrowth(data,scores,checklist);
  }
  content.querySelector("#btnTrackRefresh")?.addEventListener("click",()=>loadTrack(data,scores,checklist));
  /* Quota du plan gratuit : le bouton d'upgrade doit mener quelque part. */
  content.querySelector("#btnFreeLimitUpgrade")?.addEventListener("click",()=>
    window.open("https://vidsparkpro.com/pricing.html","_blank"));

  /* ⚡ Corriger automatiquement : enchaîne les corrections dans l'ordre d'impact. */
  const autofix=content.querySelector("#btnCoachAutofix");
  if(autofix) autofix.addEventListener("click",()=>{
    autofix.disabled=true;
    autofix.innerHTML=spinnerHTML(T("co_af_open")).replace(/^<div class="echo-spinner-wrap">|<\/div>$/g,"");
    coachLaunch(autofix.dataset.goto,autofix.dataset.run,autofix.dataset.key);
  });

  /* Voir tout / réduire */
  const more=content.querySelector("#btnCoachMore");
  if(more) more.addEventListener("click",()=>{
    const box=content.querySelector("#coachRest"); if(!box)return;
    const open=box.hidden;
    box.hidden=!open;
    more.setAttribute("aria-expanded",String(open));
    more.innerHTML=open?`${T("co_less")} ⌃`:`${T("co_more")} (${box.children.length}) ⌄`;
  });

  /* 💬 Ouvrir le Coach conversationnel */
  content.querySelector("#btnCoachAsk")?.addEventListener("click",()=>openCoachChat(data,scores,checklist));

  /* Animation des scores du hero (respecte prefers-reduced-motion) */
  if(tab==="coach") animateCoachHero(content);

  /* Rapport complet (overview + actions) */
  content.querySelector("#btnFullReport")?.addEventListener("click",openFullReport);
  content.querySelector("#btnFullReport2")?.addEventListener("click",openFullReport);

  /* 📊 Stats réelles YouTube (vraies données via API v3) */
  content.querySelector("#btnRealStats")?.addEventListener("click",async()=>{
    setContent("card-realstats",spinnerHTML(T("spin_realstats")));
    try{
      const r=await sendBG({action:"yt_video",videoId:data.videoId});
      const cell=(v,l)=>`<div class="echo-rs-cell"><b>${v}</b><span>${l}</span></div>`;
      const tags=(r.tags&&r.tags.length)?`<div class="echo-card-head" style="margin-top:10px">🏷️ ${T("stat_tags_real")} (${r.tags.length})</div><div class="echo-tag-cloud">${r.tags.slice(0,18).map(t=>`<span class="echo-kw-tag">${esc(t)}</span>`).join("")}</div>`:`<div style="color:#888;font-size:12px;margin-top:8px">${T("no_tag")}</div>`;
      setContent("card-realstats",`
        <div class="echo-card-head">📊 ${T("live_stats_title")} <span class="echo-badge" style="background:rgba(255,0,0,.15);color:#ff5252">● LIVE</span></div>
        <div class="echo-rs-grid">
          ${cell(fmtNum(r.views),T("stat_views"))}
          ${cell(fmtNum(r.views_per_hour)+"/h",T("stat_vph"))}
          ${cell(fmtNum(r.likes),T("stat_likes"))}
          ${cell(fmtNum(r.comments),T("stat_comments"))}
          ${cell(r.engagement_rate+"%",T("stat_engagement"))}
          ${cell(fmtNum(r.channel_subs),T("stat_subs"))}
        </div>
        ${tags}`);
    }catch(e){setContent("card-realstats",errHTML(e.message));}
  });

  /* 📈 Audit de chaîne */
  content.querySelector("#btnChannelAudit")?.addEventListener("click",async()=>{
    setContent("card-audit",spinnerHTML(T("spin_audit")));
    try{
      let cid=extractYouTubeChannelId();
      if(!cid){ const v=await sendBG({action:"yt_video",videoId:data.videoId}); cid=v&&v.channel_id; }
      if(!cid) throw new Error(T("err_channel"));
      const a=await sendBG({action:"channel_audit",channelId:cid});
      const cell=(v,l)=>`<div class="echo-rs-cell"><b>${v}</b><span>${l}</span></div>`;
      setContent("card-audit",`
        <div class="echo-card-head">📈 ${T("audit_title")} : ${esc((a.channel||"").slice(0,30))} <span class="echo-badge" style="background:rgba(255,0,0,.15);color:#ff5252">● LIVE</span></div>
        <div class="echo-rs-grid">
          ${cell(fmtNum(a.subs),T("stat_subs"))}
          ${cell(fmtNum(a.avg_views),T("stat_avg_views"))}
          ${cell((a.avg_engagement||0)+"%",T("stat_engagement"))}
          ${cell(a.upload_freq_days?a.upload_freq_days+"j":"—",T("stat_freq"))}
          ${cell((a.tags_usage_pct||0)+"%",T("stat_tagged"))}
          ${cell(fmtNum(a.total_videos),T("stat_total_vids"))}
        </div>
        ${a.best_video?`<div style="margin-top:8px;font-size:11px;color:#22c55e">🏆 ${esc(a.best_video.title.slice(0,45))} — ${fmtNum(a.best_video.views)} vues</div>`:""}`);
    }catch(e){setContent("card-audit",errHTML(e.message));}
  });

  /* 🏆 Vrais concurrents */
  content.querySelector("#btnRealComp")?.addEventListener("click",async()=>{
    setContent("realCompResults",spinnerHTML("📡 Recherche..."));
    try{
      // Requête courte : 1ère partie du titre (avant | - séparateurs) + 6 premiers mots
      const q=(data.title||"").split(/[|\-–—:•]/)[0].trim().split(/\s+/).slice(0,6).join(" ")||data.title;
      const r=await sendBG({action:"yt_competitors",query:q});
      const rows=(r.videos||[]).slice(0,6).map(v=>`
        <div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid #1a1a1a;">
          <div style="flex:1;overflow:hidden;"><div style="font-size:12px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(v.title)}</div><div style="font-size:10px;color:#888;">${esc(v.channel)}</div></div>
          <div style="text-align:right;font-size:11px;white-space:nowrap;"><b style="color:#ff5252">${fmtNum(v.views_per_hour)}/h</b><br><span style="color:#888">${fmtNum(v.views)} vues</span></div>
        </div>`).join("");
      setContent("realCompResults",`<div style="margin-top:6px">${rows||"<div style='color:#888'>"+T("no_result")+"</div>"}</div>`);
    }catch(e){setContent("realCompResults",errHTML(e.message));}
  });

  /* 🔑 Mots-clés */
  content.querySelector("#btnKeywords")?.addEventListener("click",async()=>{
    const q=(content.querySelector("#kwInput")?.value||data.title||"").trim();
    if(!q)return;
    setContent("kwResults",spinnerHTML(T("spin_kw")));
    try{
      const k=await sendBG({action:"keywords",query:q,opportunity:true,language:currentLanguage});
      const color=k.competition==="faible"?"#22c55e":k.competition==="moyenne"?"#f5b301":"#ff5252";
      const sugg=(k.suggestions||[]).map(s=>`<span class="echo-kw-tag">${esc(s)}</span>`).join("");
      const o=k.opportunity;
      const diffColor=d=>d==="facile"?"#22c55e":d==="moyen"?"#f5b301":"#ff5252";
      let oppHTML="";
      if(o){
        const oc=scoreColor(o.score||50);
        const chip=(label,val,c)=>`<div style="flex:1;text-align:center;"><div style="font-size:10px;color:#888;">${label}</div><div style="font-size:12px;font-weight:700;color:${c};">${esc(val||"—")}</div></div>`;
        const best=(o.best_keywords||[]).map(b=>`
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline;padding:4px 0;border-bottom:1px solid #1a1a1a;">
            <span style="font-size:12px;color:#e8e8f0;flex:1;">${esc(b.keyword||"")}</span>
            <span class="echo-badge" style="background:${diffColor(b.difficulty)}22;color:${diffColor(b.difficulty)};white-space:nowrap;">${esc(b.difficulty||"")}</span>
          </div>`).join("");
        oppHTML=`
          <div class="echo-card" style="margin:8px 0;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <div style="font-size:26px;font-weight:800;color:${oc}">${o.score??"—"}</div>
              <div><div style="font-size:11px;color:#aaa;">${T("kw_opportunity")}</div><div style="font-size:12px;color:#e8e8f0;">${esc(o.verdict||"")}</div></div>
            </div>
            <div style="display:flex;gap:6px;margin-bottom:8px;">
              ${chip(T("kw_difficulty"),o.difficulty,diffColor(o.difficulty))}
              ${chip(T("kw_demand"),o.demand,"#3b82f6")}
              ${chip(T("kw_trend"),o.trend,"#7c6dfa")}
            </div>
            ${best?`<div style="font-size:11px;color:#22c55e;font-weight:700;margin-bottom:2px;">${T("kw_best")}</div>${best}`:""}
          </div>`;
      }
      setContent("kwResults",`
        ${oppHTML}
        <div style="margin:6px 0;font-size:12px;">${T("kw_competition")} : <b style="color:${color}">${k.competition}</b> ${k.top_avg_views?`(top ~${fmtNum(k.top_avg_views)} vues)`:""}</div>
        <div class="echo-tag-cloud">${sugg||"<span style='color:#888'>"+T("no_sugg")+"</span>"}</div>`);
    }catch(e){setContent("kwResults",errHTML(e.message));}
  });

  /* 🔑 Mots-clés suggérés DYNAMIQUES (auto sur l'onglet Concurrence) */
  if(document.getElementById("missingKwBody")){
    (async()=>{
      try{
        const k=await sendBG({action:"keywords",query:data.title});
        const tl=(data.title||"").toLowerCase();
        const sugg=(k.suggestions||[]).filter(s=>s && !tl.includes(s.toLowerCase())).slice(0,10);
        const el=document.getElementById("missingKwBody");
        if(el) el.innerHTML = sugg.length
          ? `<div class="echo-tag-cloud">${sugg.map(s=>`<span class="echo-kw-tag missing">${esc(s)}</span>`).join("")}</div>`
          : "<span style='color:#888'>"+T("no_sugg_more")+"</span>";
      }catch(e){ const el=document.getElementById("missingKwBody"); if(el) el.innerHTML="<span style='color:#888'>"+esc(T("wf_na"))+"</span>"; }
    })();
  }

  /* 🎨 Analyse miniature IA */
  content.querySelector("#btnThumbAI")?.addEventListener("click",async()=>{
    setContent("card-thumb-ai",spinnerHTML(T("spin_thumb_ai")));
    try{
      const t=await sendBG({action:"thumbnail",videoId:data.videoId,title:data.title,language:currentLanguage});
      const tips=(t.tips||[]).map(x=>`<div class="echo-suggestion">💡 ${esc(x)}</div>`).join("");
      const strong=(t.strengths||[]).map(x=>`<div class="echo-suggestion" style="border-left-color:#22c55e">✅ ${esc(x)}</div>`).join("");
      setContent("card-thumb-ai",`
        <div class="echo-card-head">🎨 ${T("thumb_ai_title")} <span class="echo-badge echo-badge-ai">Vision</span></div>
        <div style="font-size:24px;font-weight:800;color:${scoreColor(t.score||70)};margin:4px 0">${t.score!==undefined?t.score:"—"}/100</div>
        ${strong}${tips}`);
    }catch(e){setContent("card-thumb-ai",errHTML(e.message));}
  });

  /* 🎨 Générateur de concepts de miniature */
  content.querySelector("#btnThumbIdeas")?.addEventListener("click",async()=>{
    setContent("card-thumb-ideas-result",spinnerHTML("🎨 "+(T("thumb_ideas_loading")||"Génération des concepts…")));
    try{
      const niche=(content.querySelector("#thumbIdeaNiche")?.value||"").trim();
      const r=await sendBG({action:"thumbnail_ideas",title:data.title,niche,language:currentLanguage});
      const concepts=r.concepts||[];
      const cards=concepts.map((c,i)=>{
        const pal=(c.palette||[]).slice(0,3);
        const c0=pal[0]||"#7c6dfa", c1=pal[1]||"#ef4444", c2=pal[2]||"#ffffff";
        const place=(c.face&&c.face.placement)||"";
        const justify=place.indexOf("gauche")>=0?"flex-end":place.indexOf("droite")>=0?"flex-start":"center";
        const swatches=pal.map(h=>`<span style="display:inline-block;width:22px;height:22px;border-radius:5px;border:1px solid #2a2a35;background:${esc(h)};" title="${esc(h)}"></span>`).join(" ");
        const brief=`${T("thumb_ideas_emotion")||"Émotion"}: ${c.emotion||""}\n${T("thumb_ideas_text")||"Texte"}: ${c.text||""}\nPalette: ${pal.join(", ")}\n${T("thumb_ideas_focal")||"Point focal"}: ${c.focal_point||""}\n${T("thumb_ideas_face")||"Visage"}: ${(c.face&&c.face.expression)||""} (${place})\nStyle: ${c.style||""}\n${T("thumb_ideas_bg")||"Fond"}: ${c.background||""}\nImage prompt: ${c.image_prompt||""}\n${T("thumb_ideas_why")||"Pourquoi"}: ${c.justification||""}`;
        return `
          <div class="echo-card" data-copy="${esc(brief)}" style="margin-top:8px;">
            <div class="echo-card-head" style="display:flex;justify-content:space-between;align-items:center;">
              <span>🎨 ${T("thumb_ideas_concept")||"Concept"} #${i+1}</span>
              <span class="echo-badge echo-badge-purple">${esc(c.emotion||"")}</span>
            </div>
            <div style="position:relative;height:84px;border-radius:8px;overflow:hidden;margin-bottom:8px;background:linear-gradient(135deg,${esc(c0)},${esc(c1)});display:flex;align-items:center;justify-content:${justify};padding:0 12px;">
              <div style="font-weight:900;font-size:18px;color:${esc(c2)};text-shadow:0 2px 6px rgba(0,0,0,.6);line-height:1.1;max-width:72%;">${esc((c.text||"").toUpperCase())}</div>
            </div>
            <div style="margin-bottom:6px;">${swatches}</div>
            <div style="font-size:12px;color:#ccc;margin:3px 0;">📝 <b>${T("thumb_ideas_text")||"Texte"}:</b> ${esc(c.text||"")}</div>
            <div style="font-size:12px;color:#ccc;margin:3px 0;">🎯 <b>${T("thumb_ideas_focal")||"Point focal"}:</b> ${esc(c.focal_point||"")}</div>
            <div style="font-size:12px;color:#ccc;margin:3px 0;">🙂 <b>${T("thumb_ideas_face")||"Visage"}:</b> ${esc((c.face&&c.face.expression)||"")} — ${esc(place)}</div>
            <div style="font-size:12px;color:#ccc;margin:3px 0;">🖼️ <b>${T("thumb_ideas_bg")||"Fond"}:</b> ${esc(c.background||"")}</div>
            <div style="font-size:11px;color:#22c55e;margin-top:6px;">✅ ${esc(c.justification||"")}</div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
              <button class="echo-copy-mini echo-copy-brief" style="width:auto;padding:4px 10px;">⧉ ${T("thumb_ideas_copy")||"Copier le brief"}</button>
              <button class="echo-copy-mini echo-gen-bg" data-imgprompt="${esc(c.image_prompt||c.background||c.text||"")}" data-text="${esc(c.text||"")}" data-place="${esc(place)}" data-color="${esc(c2)}" style="width:auto;padding:4px 10px;background:#7c6dfa;color:#fff;">${T("thumb_gen_btn")}</button>
            </div>
            <div class="echo-genbg-result" style="margin-top:8px;"></div>
          </div>`;
      }).join("");
      let lockedBlock="";
      if(r.preview && r.locked>0){
        lockedBlock=`
          <div style="position:relative;margin-top:8px;border-radius:12px;overflow:hidden;">
            <div style="filter:blur(6px);opacity:.6;pointer-events:none;" class="echo-card">
              <div class="echo-card-head">🎨 ${T("lk_hidden")}</div>
            </div>
            <div class="echo-locked-overlay" style="position:absolute;inset:0;">
              <div class="echo-locked-icon">🔒</div>
              <div class="echo-locked-title">+${r.locked} ${T("thumb_ideas_concept")||"concepts"}</div>
              <div class="echo-locked-sub">${T("thumb_ideas_locked_sub")||"Passe à Pro pour débloquer les 3 concepts"}</div>
              <button class="echo-locked-btn" id="btnUnlockThumbIdeas">⭐ ${T("upgrade_btn")}</button>
            </div>
          </div>`;
      }
      setContent("card-thumb-ideas-result",cards+lockedBlock || `<div style="color:#888">${T("error_generic")}</div>`);
      content.querySelectorAll(".echo-copy-brief").forEach(b=>{
        b.addEventListener("click",()=>{const c=b.closest("[data-copy]");navigator.clipboard.writeText(c.dataset.copy||"");showToast(T("copied_title"));});
      });
      content.querySelectorAll(".echo-gen-bg").forEach(b=>{
        b.addEventListener("click",async()=>{
          const out=b.closest(".echo-card").querySelector(".echo-genbg-result");
          out.innerHTML=spinnerHTML("🖼️ "+(T("thumb_gen_loading")||"Génération du fond…"));
          try{
            const g=await sendBG({action:"thumbnail_gen",title:data.title,prompt:b.dataset.imgprompt||"",no_text:true});
            if(g&&g.image){
              const src=`data:${g.mime||'image/jpeg'};base64,${g.image}`;
              const pl=b.dataset.place||"";
              const c0=b.dataset.color||"#ffffff";
              const baseCol=/^#[0-9a-fA-F]{6}$/.test(c0)?c0:"#ffffff";
              const baseX=pl.indexOf("gauche")>=0?28:pl.indexOf("droite")>=0?72:50;
              const layers=[
                { text:(b.dataset.text||""), color:baseCol,    fontPx:32, fontFam:"Arial Black", posX:baseX, posY:40 },
                { text:"",                    color:"#ffde59", fontPx:22, fontFam:"Impact",      posX:baseX, posY:62 }
              ];
              const fonts=["Arial Black","Impact","Tahoma","Verdana","Georgia","Trebuchet MS"];
              const fontOpts=(sel)=>fonts.map(f=>`<option value="${f}" ${f===sel?"selected":""}>${f}</option>`).join("");
              const rowCtl=(i)=>`
                <div style="border:1px solid #1b2330;border-radius:8px;padding:6px;margin-bottom:6px;">
                  <input class="eg-text" data-i="${i}" value="${esc(layers[i].text)}" placeholder="${(T("thumb_gen_line")||"Ligne")+" "+(i+1)}" style="width:100%;box-sizing:border-box;background:#141418;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:13px;margin-bottom:5px;">
                  <div style="display:flex;gap:6px;align-items:center;">
                    <input type="color" class="eg-color" data-i="${i}" value="${layers[i].color}" title="${T("thumb_gen_color")||"Couleur"}" style="width:34px;height:28px;padding:0;border:1px solid #2a2a35;border-radius:6px;background:#141418;">
                    <select class="eg-font" data-i="${i}" title="${T("thumb_gen_font")||"Police"}" style="flex:1;min-width:0;background:#141418;border:1px solid #2a2a35;border-radius:6px;color:#e8e8f0;padding:6px;font-size:12px;">${fontOpts(layers[i].fontFam)}</select>
                    <input type="range" class="eg-size" data-i="${i}" min="12" max="64" value="${layers[i].fontPx}" title="${T("thumb_gen_size")||"Taille"}" style="width:64px;">
                  </div>
                </div>`;
              out.innerHTML=`
                ${rowCtl(0)}${rowCtl(1)}
                <div class="eg-stage" style="position:relative;border-radius:8px;overflow:hidden;border:1px solid #2a2a35;touch-action:none;">
                  <img src="${src}" draggable="false" style="width:100%;display:block;pointer-events:none;">
                  ${layers.map((l,i)=>`<div class="eg-txt" data-i="${i}" style="position:absolute;left:${l.posX}%;top:${l.posY}%;transform:translate(-50%,-50%);font-family:'${l.fontFam}';font-weight:900;font-size:${l.fontPx}px;color:${l.color};text-shadow:0 3px 10px rgba(0,0,0,.85),0 0 4px rgba(0,0,0,.7);line-height:1.05;text-align:center;white-space:nowrap;cursor:move;">${esc((l.text||"").toUpperCase())}</div>`).join("")}
                </div>
                <button class="echo-action-btn green eg-dl" style="margin-top:8px;">⬇ ${T("thumb_gen_download")||"Télécharger l'image"}</button>
                <div style="font-size:11px;color:#888;margin-top:5px;">${T("thumb_gen_drag_note")||"2 lignes : tape ton texte, glisse chaque ligne, choisis couleur/taille/police, puis télécharge."}</div>`;
              const stage=out.querySelector(".eg-stage");
              const txtEls=[...out.querySelectorAll(".eg-txt")];
              function applyOne(i){ const el=txtEls[i],l=layers[i]; el.textContent=(l.text||"").toUpperCase(); el.style.left=l.posX+"%"; el.style.top=l.posY+"%"; el.style.color=l.color; el.style.fontSize=l.fontPx+"px"; el.style.fontFamily="'"+l.fontFam+"'"; el.style.display=l.text?"":"none"; }
              function applyAll(){ layers.forEach((_,i)=>applyOne(i)); }
              applyAll();
              out.querySelectorAll(".eg-text").forEach(inp=>inp.addEventListener("input",()=>{layers[+inp.dataset.i].text=inp.value;applyOne(+inp.dataset.i);}));
              out.querySelectorAll(".eg-color").forEach(ci=>ci.addEventListener("input",()=>{layers[+ci.dataset.i].color=ci.value;applyOne(+ci.dataset.i);}));
              out.querySelectorAll(".eg-size").forEach(si=>si.addEventListener("input",()=>{layers[+si.dataset.i].fontPx=+si.value;applyOne(+si.dataset.i);}));
              out.querySelectorAll(".eg-font").forEach(fs=>fs.addEventListener("change",()=>{layers[+fs.dataset.i].fontFam=fs.value;applyOne(+fs.dataset.i);}));
              let dragIdx=-1;
              txtEls.forEach((el,i)=>{
                el.addEventListener("pointerdown",e=>{dragIdx=i;try{el.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();});
                el.addEventListener("pointermove",e=>{ if(dragIdx!==i)return; const r=stage.getBoundingClientRect(); layers[i].posX=Math.max(2,Math.min(98,(e.clientX-r.left)/r.width*100)); layers[i].posY=Math.max(4,Math.min(96,(e.clientY-r.top)/r.height*100)); applyOne(i); });
                el.addEventListener("pointerup",()=>{dragIdx=-1;});
              });
              out.querySelector(".eg-dl").addEventListener("click",()=>{
                const im=new Image();
                im.onload=()=>{
                  const cv=document.createElement("canvas"); cv.width=im.naturalWidth||1280; cv.height=im.naturalHeight||720;
                  const cx=cv.getContext("2d"); cx.drawImage(im,0,0,cv.width,cv.height);
                  const sw=stage.getBoundingClientRect().width||360;
                  cx.textAlign="center"; cx.textBaseline="middle";
                  cx.shadowColor="rgba(0,0,0,.85)"; cx.shadowBlur=cv.width*0.012; cx.shadowOffsetY=cv.height*0.006;
                  layers.forEach(l=>{
                    const t=(l.text||"").toUpperCase(); if(!t)return;
                    const fs=Math.round(l.fontPx*(cv.width/sw));
                    cx.font=`900 ${fs}px '${l.fontFam}', Arial, sans-serif`;
                    cx.fillStyle=l.color;
                    cx.direction=/[؀-ۿ]/.test(t)?"rtl":"ltr";
                    cx.fillText(t, cv.width*l.posX/100, cv.height*l.posY/100, cv.width*0.92);
                  });
                  const a=document.createElement("a"); a.href=cv.toDataURL("image/png"); a.download="vidspark-thumbnail.png"; a.click();
                  showToast(T("thumb_gen_downloaded")||"Image téléchargée");
                };
                im.onerror=()=>showToast(T("error_generic"));
                im.src=src;
              });
            }
            else { out.innerHTML=`<div style="color:#888;font-size:12px;">${T("error_generic")}</div>`; }
          }catch(e){ out.innerHTML=errHTML(e.message); }
        });
      });
      document.getElementById("btnUnlockThumbIdeas")?.addEventListener("click",()=>window.open("https://vidsparkpro.com/billing","_blank"));
    }catch(e){setContent("card-thumb-ideas-result",errHTML(e.message));}
  });

  /* 🔗 Vérif Titre + Miniature (paire) */
  content.querySelector("#btnPairCheck")?.addEventListener("click",async()=>{
    setContent("card-pair-result",spinnerHTML(T("spin_pair")));
    try{
      const r=await sendBG({action:"pair_check",videoId:data.videoId,title:data.title,language:currentLanguage});
      const yn=b=>b?'<span style="color:#22c55e">✓</span>':'<span style="color:#ef4444">✗</span>';
      const list=(arr,ic,c)=>(arr||[]).map(x=>`<div style="font-size:12px;color:${c};margin:2px 0;">${ic} ${esc(x)}</div>`).join("");
      setContent("card-pair-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="font-size:24px;font-weight:800;color:${scoreColor(r.match_score||50)}">${r.match_score??"—"}</div>
            <div style="font-size:12px;color:#e8e8f0;flex:1;">${esc(r.verdict||"")}</div>
          </div>
          <div style="font-size:11px;color:#aaa;margin-bottom:6px;">📺 TV ${yn(r.tv_readable)} &nbsp; 📱 Mobile ${yn(r.mobile_readable)} &nbsp; 🔗 ${T("pc_complement")} ${yn(r.complement)}</div>
          ${r.issues?.length?`<div style="font-size:11px;color:#ef4444;font-weight:700;">${T("pc_issues")}</div>${list(r.issues,"✗","#e69f9f")}`:""}
          ${r.tips?.length?`<div style="font-size:11px;color:#22c55e;font-weight:700;margin-top:6px;">${T("pc_tips")}</div>${list(r.tips,"→","#ccc")}`:""}
        </div>`);
    }catch(e){setContent("card-pair-result",errHTML(e.message));}
  });

  /* 🎞️ Optimiseur de playlists */
  content.querySelector("#btnPlaylists")?.addEventListener("click",async()=>{
    setContent("card-playlists-result",spinnerHTML(T("spin_playlists")));
    try{
      let cid=extractYouTubeChannelId();
      if(!cid){ const v=await sendBG({action:"yt_video",videoId:data.videoId}); cid=v&&v.channel_id; }
      if(!cid) throw new Error(T("err_channel"));
      const r=await sendBG({action:"playlists",channelId:cid,language:currentLanguage});
      const pls=(r.playlists||[]).map(p=>`
        <div class="echo-card" data-txt="${esc((p.name||"")+"\n"+(p.description||"")+"\n- "+(p.videos||[]).join("\n- "))}" style="margin-top:8px;">
          <div style="font-size:13px;font-weight:700;color:#fff;">🎞️ ${esc(p.name||"")}</div>
          <div style="font-size:11px;color:#888;margin-bottom:4px;">${esc(p.description||"")}</div>
          ${(p.videos||[]).map(v=>`<div style="font-size:11px;color:#ccc;">• ${esc(v)}</div>`).join("")}
          <button class="echo-copy-mini echo-copy-pl" style="margin-top:6px;width:auto;padding:4px 10px;">⧉ ${T("com_copy")}</button>
        </div>`).join("");
      setContent("card-playlists-result",pls||`<div style="color:#888;font-size:12px;">${T("error_generic")}</div>`);
      content.querySelectorAll(".echo-copy-pl").forEach(b=>b.addEventListener("click",()=>{navigator.clipboard.writeText(b.closest("[data-txt]").dataset.txt);showToast(T("copied_title"));}));
    }catch(e){setContent("card-playlists-result",errHTML(e.message));}
  });

  /* 🖼️ Génération de miniature IA */
  /* Bouton Passer à Pro */
  content.querySelector(".echo-upgrade-btn")?.addEventListener("click",()=>{
    window.open("https://vidsparkpro.com/billing","_blank");
  });

  /* Cadenas "Passer à Pro" sur les fonctions floutées (utilisateurs Free) */
  content.querySelectorAll(".echo-locked-btn").forEach(b=>{
    b.addEventListener("click",()=>window.open("https://vidsparkpro.com/billing","_blank"));
  });

  /* Sous-onglets SEO */
  content.querySelectorAll(".echo-seo-subtab").forEach(btn=>{
    btn.addEventListener("click",()=>{
      seoSubTab=btn.dataset.sub;
      const subContent=document.getElementById("seoSubContent");
      if(subContent){
        // Re-render sub content
        content.querySelectorAll(".echo-seo-subtab").forEach(b=>b.classList.toggle("active",b.dataset.sub===seoSubTab));
        // Appeler renderSEO pour obtenir le nouveau contenu du sous-onglet
        const seoData=getVideoData();
        const seoScores=scores;
        const seoChecklist=checklist;
        // Reconstruire uniquement la partie contenu
        const tmpDiv=document.createElement("div");
        tmpDiv.innerHTML=renderSEO(seoData||data,seoScores,seoChecklist);
        const newSubContent=tmpDiv.querySelector("#seoSubContent");
        if(newSubContent)subContent.innerHTML=newSubContent.innerHTML;
        bindTabEvents("seo",data,scores,checklist);
      }
    });
  });

  /* SEO IA */
  content.querySelector("#btnSEOReport")?.addEventListener("click",async()=>{
    setContent("card-seo-ai",spinnerHTML());
    try{
      const res=await sendBG({action:"seo_report",videoId:data.videoId,title:data.title,description:data.description,language:currentLanguage});
      const items=(res.checklist||[]).map(c=>`
        <div class="echo-check-row">
          <span class="echo-check-dot ${c.status}"></span>
          <div style="flex:1">
            <div class="echo-check-text">${esc(c.item)}</div>
            <div class="echo-check-sub">${esc(c.detail)}</div>
          </div>
        </div>`).join("");
      const suggs=(res.suggestions||[]).map(s=>`<div class="echo-suggestion">${esc(s)}</div>`).join("");
      const lockCTA = res.preview ? `
        <div style="position:relative;margin-top:10px;border-radius:12px;overflow:hidden;">
          <div style="filter:blur(6px);opacity:.6;pointer-events:none;">
            <div class="echo-suggestion">✦ ${T("lk_hidden")}</div>
            <div class="echo-suggestion">✦ ${T("lk_hidden")}</div>
          </div>
          <div class="echo-locked-overlay" style="position:absolute;inset:0;">
            <div class="echo-locked-icon">🔒</div>
            <div class="echo-locked-title">${T("co_report")}</div>
            <div class="echo-locked-sub">${T("lk_all")}</div>
            <button class="echo-locked-btn" id="btnUnlockReport">⭐ ${T("upgrade_btn")}</button>
          </div>
        </div>` : "";
      setContent("card-seo-ai",`
        <div class="echo-card-head">${T("seo_suggestions")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${res.preview?' <span class="echo-badge" style="background:rgba(34,197,94,.15);color:#22c55e">${T("lk_preview")}</span>':''}</div>
        <div class="echo-ai-insight">${esc(res.viral_reason||T("analysis_done"))}</div>
        ${items}
        ${suggs?`<div style="margin-top:8px">${suggs}</div>`:""}
        <div style="margin-top:8px;font-size:20px;font-weight:800;color:${scoreColor(res.score||scores.seo)}">${res.score||scores.seo}/100</div>
        ${lockCTA}`);
      document.getElementById("btnUnlockReport")?.addEventListener("click",()=>window.open("https://vidsparkpro.com/billing","_blank"));
    }catch(e){setContent("card-seo-ai",errHTML(e.message));}
  });

  /* Viral IA */
  content.querySelector("#btnViralAI")?.addEventListener("click",async()=>{
    setContent("card-viral-ai",spinnerHTML());
    try{
      const res=await sendBG({action:"seo_report",videoId:data.videoId,title:data.title,description:data.description,language:currentLanguage});
      setContent("card-viral-ai",`
        <div class="echo-card-head">${T("viral_prediction")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span></div>
        <div class="echo-ai-insight">${esc(res.viral_reason||T("analysis_done"))}</div>
        <div style="margin-top:8px;font-size:18px;font-weight:800;color:${scoreColor(res.viral_score||scores.viral)}">${T("viral_score")} : ${res.viral_score||scores.viral}/100</div>`);
    }catch(e){setContent("card-viral-ai",errHTML(e.message));}
  });

  /* Détecteur de tendances */
  content.querySelector("#btnTrends")?.addEventListener("click",async()=>{
    const niche=content.querySelector("#treNiche")?.value||"";
    const region=content.querySelector("#treRegion")?.value||"";
    if(!niche){ showToast(T("tre_need")); return; }
    setContent("card-trends-result",spinnerHTML(T("spin_trends")));
    try{
      const r=await sendBG({action:"trends",niche,region,language:currentLanguage});
      if(r.empty||(!(r.trends||[]).length&&!(r.videos||[]).length)){ setContent("card-trends-result",`<div style="color:#888;font-size:12px;margin-top:8px;">${T("tre_none")}</div>`); return; }
      const vids=(r.videos||[]).slice(0,6).map(v=>`
        <div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid #1a1a1a;">
          <div style="flex:1;overflow:hidden;"><div style="font-size:12px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(v.title)}</div><div style="font-size:10px;color:#888;">${esc(v.channel)}</div></div>
          <div style="text-align:right;white-space:nowrap;"><b style="color:#ff5252;font-size:11px;">${fmtNum(v.views_per_hour)}/h</b></div>
        </div>`).join("");
      const trends=(r.trends||[]).map(t=>`
        <div style="border-left:3px solid #7c6dfa;padding:4px 8px;margin:6px 0;background:#0e0e12;border-radius:0 6px 6px 0;">
          <div style="font-size:12px;font-weight:700;color:#e8e8f0;">🔥 ${esc(t.topic||"")} ${t.format?`<span class="echo-badge echo-badge-purple">${esc(t.format)}</span>`:""}</div>
          ${t.why?`<div style="font-size:11px;color:#999;margin-top:2px;">${esc(t.why)}</div>`:""}
        </div>`).join("");
      const list=(arr,ic,c)=>(arr||[]).map(x=>`<div style="font-size:12px;color:${c};margin:2px 0;">${ic} ${esc(x)}</div>`).join("");
      setContent("card-trends-result",`
        <div class="echo-card" style="margin-top:8px;">
          ${trends?`<div style="font-size:11px;color:#7c6dfa;font-weight:700;">${T("tre_trends")}</div>${trends}`:""}
          ${r.rising_keywords?.length?`<div style="font-size:11px;color:#eab308;font-weight:700;margin-top:8px;">${T("tre_keywords")}</div><div class="echo-tag-cloud">${r.rising_keywords.map(k=>`<span class="echo-kw-tag">${esc(k)}</span>`).join("")}</div>`:""}
          ${r.advice?.length?`<div style="font-size:11px;color:#22c55e;font-weight:700;margin-top:8px;">${T("tre_advice")}</div>${list(r.advice,"→","#ccc")}`:""}
          ${vids?`<div style="font-size:11px;color:#ff5252;font-weight:700;margin-top:8px;">${T("tre_hot")}</div>${vids}`:""}
        </div>`);
    }catch(e){setContent("card-trends-result",errHTML(e.message));}
  });

  /* Planificateur de contenu 7 jours */
  content.querySelector("#btnPlanner")?.addEventListener("click",async()=>{
    const niche=content.querySelector("#plNiche")?.value||"";
    const region=content.querySelector("#plRegion")?.value||"";
    const frequency=content.querySelector("#plFreq")?.value||"";
    setContent("card-planner-result",spinnerHTML(T("spin_planner")));
    try{
      const r=await sendBG({action:"plan",niche,region,frequency,language:currentLanguage});
      const days=r.plan||[];
      if(!days.length){ setContent("card-planner-result",`<div style="color:#888;font-size:12px;margin-top:8px;">${T("error_generic")}</div>`); return; }
      const tColor=t=>/short/i.test(t)?"#ec4899":/repos|rest|راحة|休/i.test(t)?"#888":"#3b82f6";
      const rows=days.map(d=>`
        <div style="display:flex;gap:8px;padding:7px 0;border-bottom:1px solid #1a1a1a;">
          <div style="width:62px;flex-shrink:0;"><div style="font-size:12px;font-weight:700;color:#fff;">${esc(d.day||"")}</div><div style="font-size:10px;color:#7c6dfa;">${esc(d.time||"")}</div></div>
          <div style="flex:1;">
            <span class="echo-badge" style="background:${tColor(d.type)}22;color:${tColor(d.type)};">${esc(d.type||"")}</span>
            <div style="font-size:12px;color:#e8e8f0;margin-top:3px;">${esc(d.idea||"")}</div>
            ${d.why?`<div style="font-size:10px;color:#888;">${esc(d.why)}</div>`:""}
          </div>
        </div>`).join("");
      setContent("card-planner-result",`<div class="echo-card" style="margin-top:8px;">${rows}</div>`);
    }catch(e){setContent("card-planner-result",errHTML(e.message));}
  });

  /* Posts communautaires */
  content.querySelector("#btnCommunity")?.addEventListener("click",async()=>{
    const niche=content.querySelector("#ideaNiche")?.value||"";
    const topic=(content.querySelector("#ideaTopic")?.value||"").trim();
    setContent("card-community-result",spinnerHTML(T("spin_community")));
    try{
      const r=await sendBG({action:"community",niche,topic,language:currentLanguage});
      const posts=r.posts||[];
      if(!posts.length){ setContent("card-community-result",`<div style="color:#888;font-size:12px;margin-top:8px;">${T("error_generic")}</div>`); return; }
      const cards=posts.map(p=>{
        const opts=(p.options&&p.options.length)?`<div style="margin-top:4px;">${p.options.map(o=>`<div style="font-size:11px;color:#aaa;">⚪ ${esc(o)}</div>`).join("")}</div>`:"";
        const full=`${p.text||""}${(p.options&&p.options.length)?"\n- "+p.options.join("\n- "):""}`;
        return `
          <div class="echo-card" data-txt="${esc(full)}" style="margin-top:8px;">
            <span class="echo-badge echo-badge-purple">${esc(p.type||"")}</span>
            <div style="font-size:13px;color:#e8e8f0;margin-top:6px;">${esc(p.text||"")}</div>
            ${opts}
            <button class="echo-copy-mini echo-copy-cp" style="margin-top:6px;width:auto;padding:4px 10px;">⧉ ${T("com_copy")}</button>
          </div>`;
      }).join("");
      setContent("card-community-result",cards);
      content.querySelectorAll(".echo-copy-cp").forEach(b=>b.addEventListener("click",()=>{navigator.clipboard.writeText(b.closest("[data-txt]").dataset.txt);showToast(T("copied_title"));}));
    }catch(e){setContent("card-community-result",errHTML(e.message));}
  });

  /* Générateur de script complet */
  content.querySelector("#btnScript")?.addEventListener("click",async()=>{
    const topic=(content.querySelector("#scTopic")?.value||"").trim();
    const niche=content.querySelector("#scNiche")?.value||"";
    const duration=content.querySelector("#scDur")?.value||"";
    if(!topic){ showToast(T("sc_need")); return; }
    setContent("card-script-result",spinnerHTML("📝 Écriture du script…"));
    try{
      const r=await sendBG({action:"script",topic,niche,duration,language:currentLanguage});
      const secs=(r.sections||[]).map((s,i)=>`<div style="margin:6px 0;"><div style="font-size:12px;font-weight:700;color:#7c6dfa;">${i+1}. ${esc(s.title||"")}</div><div style="font-size:12px;color:#ccc;">${esc(s.content||"")}</div></div>`).join("");
      const full=`🎬 HOOK: ${r.hook||""}\n\n${r.intro||""}\n\n${(r.sections||[]).map((s,i)=>`${i+1}. ${s.title}\n${s.content}`).join("\n\n")}\n\n📣 ${r.cta||""}\n\n${r.outro||""}`;
      setContent("card-script-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="font-size:11px;color:#22c55e;font-weight:700;">🎬 ${T("sc_hook")}</div>
          <div style="font-size:13px;color:#e8e8f0;font-style:italic;margin-bottom:8px;">${esc(r.hook||"")}</div>
          <div style="font-size:12px;color:#ccc;margin-bottom:8px;">${esc(r.intro||"")}</div>
          ${secs}
          ${r.cta?`<div style="font-size:12px;color:#eab308;margin-top:8px;">📣 ${esc(r.cta)}</div>`:""}
          ${r.outro?`<div style="font-size:12px;color:#888;margin-top:4px;">${esc(r.outro)}</div>`:""}
          <button class="echo-action-btn green" id="btnCopyScript" data-txt="${esc(full)}" style="margin-top:8px;">📋 ${T("sc_copy")}</button>
        </div>`);
      content.querySelector("#btnCopyScript")?.addEventListener("click",e=>{navigator.clipboard.writeText(e.currentTarget.dataset.txt||"");showToast(T("copied_title"));});
    }catch(e){setContent("card-script-result",errHTML(e.message));}
  });

  /* Générateur d'idées de vidéos */
  content.querySelector("#btnIdeas")?.addEventListener("click",async()=>{
    const niche=content.querySelector("#ideaNiche")?.value||"";
    const region=content.querySelector("#ideaRegion")?.value||"";
    const topic=(content.querySelector("#ideaTopic")?.value||"").trim();
    setContent("card-ideas-result",spinnerHTML(T("spin_ideas")));
    try{
      const r=await sendBG({action:"ideas",niche,region,topic,language:currentLanguage});
      const ideas=r.ideas||[];
      if(!ideas.length){ setContent("card-ideas-result",`<div style="color:#888;font-size:12px;margin-top:8px;">${T("error_generic")}</div>`); return; }
      const cards=ideas.map((it,i)=>{
        const sc=scoreColor(it.viral_score||70);
        return `
          <div class="echo-card" data-title="${esc(it.title||"")}" style="margin-top:8px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">
              <div style="font-size:13px;font-weight:700;color:#fff;flex:1;">${i+1}. ${esc(it.title||"")}</div>
              <span class="echo-badge" style="background:${sc}22;color:${sc};white-space:nowrap;">${it.viral_score||"—"}/100</span>
            </div>
            ${it.format?`<span class="echo-badge echo-badge-purple" style="margin-top:4px;">${esc(it.format)}</span>`:""}
            ${it.angle?`<div style="font-size:12px;color:#ccc;margin-top:6px;">🎬 ${esc(it.angle)}</div>`:""}
            ${it.why?`<div style="font-size:11px;color:#888;margin-top:3px;">✅ ${esc(it.why)}</div>`:""}
            <button class="echo-copy-mini echo-copy-idea" style="margin-top:6px;width:auto;padding:4px 10px;">⧉ ${T("idea_copy")}</button>
          </div>`;
      }).join("");
      setContent("card-ideas-result",cards);
      content.querySelectorAll(".echo-copy-idea").forEach(b=>{
        b.addEventListener("click",()=>{navigator.clipboard.writeText(b.closest("[data-title]").dataset.title);showToast(T("copied_title"));});
      });
    }catch(e){setContent("card-ideas-result",errHTML(e.message));}
  });

  /* SEO TikTok : légende, hooks, hashtags, script, conseils */
  content.querySelector("#btnTikTok")?.addEventListener("click",async()=>{
    const topic=(content.querySelector("#tkTopic")?.value||"").trim();
    const niche=content.querySelector("#tkNiche")?.value||"";
    const description=(content.querySelector("#tkDesc")?.value||"").trim();
    if(topic.length<2){ setContent("card-tiktok-result",errHTML(T("tk_need_topic"))); return; }
    setContent("card-tiktok-result",spinnerHTML(T("tk_spin")));
    try{
      const d=await sendBG({action:"tiktok_seo",topic,niche,description,language:currentLanguage});
      renderTikTokSEOResult(d);
    }catch(e){setContent("card-tiktok-result",errHTML(e.message));}
  });

  /* Rendu "carte premium" du résultat SEO TikTok : header, sections, barre d'actions */
  function renderTikTokSEOResult(d){
    const ht=d.hashtags||{};
    const chips=(arr)=>`<div style="display:flex;flex-wrap:wrap;gap:5px;margin:4px 0;">${(arr||[]).map(h=>`<span class="echo-badge echo-badge-purple">${esc(h)}</span>`).join("")}</div>`;
    const allTags=[].concat(ht.broad||[],ht.niche||[],ht.trending||[]);
    const hookCount=(d.hooks||[]).length, tagCount=allTags.length;
    const fullText=[
      d.caption&&`${T("tk_caption")}:\n${d.caption}`,
      (d.hooks||[]).length&&`${T("tk_hooks")||"Hooks"}:\n${d.hooks.map(h=>"• "+h).join("\n")}`,
      allTags.length&&`Hashtags:\n${allTags.join(" ")}`,
      (d.keywords||[]).length&&`${T("tk_keywords")}:\n${d.keywords.join(", ")}`,
      (d.script||[]).length&&`${T("tk_script")}:\n${d.script.map(s=>`[${s.part}] ${s.content}`).join("\n")}`,
      d.sound_advice&&`${T("tk_sound")}:\n${d.sound_advice}`,
      [].concat(d.posting_tips||[],d.discoverability_tips||[]).length&&`${T("tk_tips")}:\n${[].concat(d.posting_tips||[],d.discoverability_tips||[]).map(t=>"• "+t).join("\n")}`
    ].filter(Boolean).join("\n\n");

    const html=`
      <div class="echo-premium echo-glass">
        <div class="echo-premium-score">
          <div class="echo-premium-score-ring" style="background:conic-gradient(#f7941d 0deg,#f7941d ${Math.min(360,hookCount*72)}deg,#2a2a35 ${Math.min(360,hookCount*72)}deg);">
            <div style="position:absolute;inset:4px;border-radius:50%;background:#141414;display:flex;align-items:center;justify-content:center;font-size:13px;">🎵</div>
          </div>
          <div>
            <div class="echo-premium-score-label">✅ ${T("tk_ready")||"Contenu prêt à publier"}</div>
            <div class="echo-premium-score-sub">${hookCount} hooks · ${tagCount} hashtags · ${(d.keywords||[]).length} ${T("tk_keywords")||"mots-clés"}</div>
          </div>
        </div>

        <div class="echo-premium-section">
          <div class="echo-premium-section-head">📝 ${T("tk_caption")}</div>
          <div class="echo-premium-section-body" style="white-space:pre-wrap;">${esc(d.caption||"")}</div>
        </div>

        <div class="echo-premium-section">
          <div class="echo-premium-section-head">🪝 Hooks</div>
          <div class="echo-premium-section-body">${(d.hooks||[]).map(h=>`<div style="margin:3px 0;">• ${esc(h)}</div>`).join("")}</div>
        </div>

        <div class="echo-premium-section">
          <div class="echo-premium-section-head">#️⃣ Hashtags</div>
          ${chips(ht.broad)}${chips(ht.niche)}${chips(ht.trending)}
        </div>

        <div class="echo-premium-section">
          <div class="echo-premium-section-head">🔎 ${T("tk_keywords")}</div>
          ${chips(d.keywords)}
        </div>

        <div class="echo-premium-section">
          <div class="echo-premium-section-head">🎬 ${T("tk_script")}</div>
          <div class="echo-premium-section-body">${(d.script||[]).map(s=>`<div style="margin:4px 0;"><span class="echo-badge">${esc(s.part||"")}</span> ${esc(s.content||"")}</div>`).join("")}</div>
        </div>

        ${d.sound_advice?`<div class="echo-premium-section"><div class="echo-premium-section-head">🎧 ${T("tk_sound")}</div><div class="echo-premium-section-body">${esc(d.sound_advice)}</div></div>`:""}

        <div class="echo-premium-section">
          <div class="echo-premium-section-head">🚀 ${T("tk_tips")}</div>
          <div class="echo-premium-section-body">${[].concat(d.posting_tips||[],d.discoverability_tips||[]).map(t=>`<div style="margin:3px 0;">• ${esc(t)}</div>`).join("")}</div>
        </div>

        <div class="echo-premium-actions">
          <button class="echo-premium-action-btn" id="tkPremCopy"><span class="ic">⧉</span>${T("tk_copy")}</button>
          <button class="echo-premium-action-btn" id="tkPremDownload"><span class="ic">⬇️</span>${T("download")||"Télécharger"}</button>
          <button class="echo-premium-action-btn" id="tkPremRegen"><span class="ic">🔄</span>${T("regenerate")||"Régénérer"}</button>
          <button class="echo-premium-action-btn" id="tkPremShare"><span class="ic">📤</span>${T("share")||"Partager"}</button>
          <button class="echo-premium-action-btn" id="tkPremExport"><span class="ic">📦</span>${T("export")||"Exporter"}</button>
        </div>
      </div>`;
    setContent("card-tiktok-result",html);

    const root=document.getElementById("card-tiktok-result");
    root.querySelector("#tkPremCopy")?.addEventListener("click",()=>{navigator.clipboard.writeText(fullText);showToast(T("copied_title"));});
    root.querySelector("#tkPremDownload")?.addEventListener("click",()=>downloadText(`tiktok-seo-${Date.now()}.txt`,fullText));
    root.querySelector("#tkPremExport")?.addEventListener("click",()=>downloadText(`tiktok-seo-${Date.now()}.json`,JSON.stringify(d,null,2),"application/json"));
    root.querySelector("#tkPremShare")?.addEventListener("click",async()=>{
      if(navigator.share){ try{ await navigator.share({title:"VidSpark AI — TikTok SEO",text:fullText}); }catch(e){} }
      else { navigator.clipboard.writeText(fullText); showToast(T("copied_title")); }
    });
    root.querySelector("#tkPremRegen")?.addEventListener("click",()=>{ content.querySelector("#btnTikTok")?.click(); });
  }

  /* Rendu générique "carte premium" pour un résultat sous forme de liste
     (clips, idées, hooks, jours de calendrier…) : en-tête + items + actions. */
  let premiumSeq=0;
  function renderPremiumList(containerId,{icon,label,sub,items,footerNote,filenamePrefix,rawData,regenBtnId}){
    const uid=`prem${++premiumSeq}`;
    const fullText=items.map(it=>it.text||"").join("\n\n");
    const itemsHtml=items.map(it=>`
      <div class="echo-premium-section" ${it.highlight?'style="background:rgba(34,197,94,.06);border-radius:8px;padding:8px;"':''}>
        <div style="display:flex;justify-content:space-between;gap:6px;align-items:flex-start;">
          <div style="font-size:12.5px;color:#e8e8f0;font-weight:600;flex:1;">${it.head||""}</div>
          ${it.headBadge?`<span class="echo-badge" style="background:${it.headBadge.color}22;color:${it.headBadge.color};flex-shrink:0;">${esc(String(it.headBadge.text))}</span>`:""}
        </div>
        <div class="echo-premium-section-body" style="margin-top:4px;">${it.body||""}</div>
      </div>`).join("");
    const html=`
      <div class="echo-premium echo-glass">
        <div class="echo-premium-score">
          <div class="echo-premium-score-ring" style="background:conic-gradient(#f7941d 0deg,#f7941d 360deg,#2a2a35 360deg);">
            <div style="position:absolute;inset:4px;border-radius:50%;background:#141414;display:flex;align-items:center;justify-content:center;font-size:13px;">${icon||"✨"}</div>
          </div>
          <div>
            <div class="echo-premium-score-label">✅ ${esc(label||"")}</div>
            <div class="echo-premium-score-sub">${esc(sub||"")}</div>
          </div>
        </div>
        ${itemsHtml}
        ${footerNote?`<div style="font-size:11px;color:#888;margin-top:8px;">${footerNote}</div>`:""}
        <div class="echo-premium-actions">
          <button class="echo-premium-action-btn" id="${uid}Copy"><span class="ic">⧉</span>${T("tk_copy")}</button>
          <button class="echo-premium-action-btn" id="${uid}Download"><span class="ic">⬇️</span>${T("download")}</button>
          <button class="echo-premium-action-btn" id="${uid}Regen"><span class="ic">🔄</span>${T("regenerate")}</button>
          <button class="echo-premium-action-btn" id="${uid}Share"><span class="ic">📤</span>${T("share")}</button>
          <button class="echo-premium-action-btn" id="${uid}Export"><span class="ic">📦</span>${T("export")}</button>
        </div>
      </div>`;
    setContent(containerId,html);
    const root=document.getElementById(containerId);
    root.querySelector(`#${uid}Copy`)?.addEventListener("click",()=>{navigator.clipboard.writeText(fullText);showToast(T("copied_title"));});
    root.querySelector(`#${uid}Download`)?.addEventListener("click",()=>downloadText(`${filenamePrefix}-${Date.now()}.txt`,fullText));
    root.querySelector(`#${uid}Export`)?.addEventListener("click",()=>downloadText(`${filenamePrefix}-${Date.now()}.json`,JSON.stringify(rawData,null,2),"application/json"));
    root.querySelector(`#${uid}Share`)?.addEventListener("click",async()=>{
      if(navigator.share){ try{ await navigator.share({title:"VidSpark AI",text:fullText}); }catch(e){} }
      else { navigator.clipboard.writeText(fullText); showToast(T("copied_title")); }
    });
    root.querySelector(`#${uid}Regen`)?.addEventListener("click",()=>{ content.querySelector(`#${regenBtnId}`)?.click(); });
  }

  /* TikTok : YouTube → TikTok (repurpose de la vidéo courante) */
  content.querySelector("#btnTkRepurpose")?.addEventListener("click",async()=>{
    if(!data.videoId){ setContent("card-tkrep-result",errHTML(T("tkr_novideo"))); return; }
    setContent("card-tkrep-result",spinnerHTML(T("tkr_spin")));
    try{
      /* Transcription lue DEPUIS la page YouTube (session navigateur = fiable),
         envoyée au backend qui ne dépend plus d'un fetch serveur bloqué. */
      let transcript="";
      try{ transcript=await getYouTubeTranscript(data.videoId); }catch(e){}
      const d=await sendBG({action:"tiktok_repurpose",videoId:data.videoId,title:data.title||"",transcript,language:currentLanguage});
      const clips=d.clips||[];
      if(!clips.length){setContent("card-tkrep-result",errHTML(T("error_generic")));return;}
      renderPremiumList("card-tkrep-result",{
        icon:"✂️", label:T("tkr_ready")||"Clips prêts à découper", sub:`${clips.length} ${T("tk_clips")||"clips"}`,
        items:clips.map((c,i)=>({
          head:`▶️ Clip ${i+1} · ${esc(c.start||"?")} → ${esc(c.end||"?")}`,
          body:`${c.angle?`<div style="color:#888;font-size:11.5px;margin-bottom:4px;">${esc(c.angle)}</div>`:""}${c.hook?`<div>🪝 ${esc(c.hook)}</div>`:""}<div style="margin-top:6px;background:#0e0e12;border-radius:6px;padding:6px;">${esc(c.caption||"")}</div>${(c.hashtags||[]).length?`<div style="margin-top:6px;">${(c.hashtags||[]).map(h=>`<span class="echo-badge echo-badge-purple">${esc(h)}</span>`).join(" ")}</div>`:""}`,
          text:`Clip ${i+1} (${c.start||"?"} → ${c.end||"?"}): ${c.hook||""}\n${c.caption||""}\n${(c.hashtags||[]).join(" ")}`
        })),
        filenamePrefix:"tiktok-repurpose", rawData:d, regenBtnId:"btnTkRepurpose"
      });
    }catch(e){setContent("card-tkrep-result",errHTML(e.message));}
  });

  /* TikTok : idées virales */
  content.querySelector("#btnTkIdeas")?.addEventListener("click",async()=>{
    const niche=content.querySelector("#tkiNiche")?.value||"";
    const topic=(content.querySelector("#tkiTopic")?.value||"").trim();
    setContent("card-tkideas-result",spinnerHTML(T("tki_spin")));
    try{
      const d=await sendBG({action:"tiktok_tool",tool:"ideas",niche,topic,language:currentLanguage});
      const ideas=d.ideas||[];
      if(!ideas.length){setContent("card-tkideas-result",errHTML(T("error_generic")));return;}
      renderPremiumList("card-tkideas-result",{
        icon:"🔥", label:T("tki_ready")||"Idées prêtes", sub:`${ideas.length} ${T("tk_ideas")||"idées"}`,
        items:ideas.map((it,i)=>{const sc=scoreColor(it.viral_score||70);return{
          head:`${i+1}. ${esc(it.title||"")}`, headBadge:{text:it.viral_score||"—",color:sc},
          body:`${it.format?`<span class="echo-badge echo-badge-purple">${esc(it.format)}</span>`:""}${it.hook?`<div style="margin-top:4px;">🪝 ${esc(it.hook)}</div>`:""}${it.why?`<div style="color:#888;font-size:11px;margin-top:2px;">✅ ${esc(it.why)}</div>`:""}`,
          text:`${i+1}. ${it.title||""} (score ${it.viral_score||"—"})\n${it.hook||""}\n${it.why||""}`
        };}),
        filenamePrefix:"tiktok-idees", rawData:d, regenBtnId:"btnTkIdeas"
      });
    }catch(e){setContent("card-tkideas-result",errHTML(e.message));}
  });

  /* TikTok : optimiseur de hooks */
  content.querySelector("#btnTkHooks")?.addEventListener("click",async()=>{
    const topic=(content.querySelector("#tkhTopic")?.value||"").trim();
    const niche=content.querySelector("#tkhNiche")?.value||"";
    if(topic.length<2){setContent("card-tkhooks-result",errHTML(T("tk_need_topic")));return;}
    setContent("card-tkhooks-result",spinnerHTML(T("tkh_spin")));
    try{
      const d=await sendBG({action:"tiktok_tool",tool:"hooks",topic,niche,language:currentLanguage});
      const hooks=d.hooks||[];
      if(!hooks.length){setContent("card-tkhooks-result",errHTML(T("error_generic")));return;}
      const best=d.best_index;
      renderPremiumList("card-tkhooks-result",{
        icon:"🪝", label:T("tkh_ready")||"Hooks prêts", sub:`${hooks.length} ${T("tk_hooks")||"hooks"}`,
        items:hooks.map((h,i)=>{const sc=scoreColor(h.score||70);return{
          head:`${i===best?"⭐ ":""}${esc(h.text||"")}`, headBadge:{text:h.score||"—",color:sc}, highlight:i===best,
          body:h.type?`<span class="echo-badge">${esc(h.type)}</span>`:"",
          text:`${i===best?"⭐ ":""}${h.text||""} (score ${h.score||"—"}, ${h.type||""})`
        };}),
        footerNote:d.tip?`💡 ${esc(d.tip)}`:"",
        filenamePrefix:"tiktok-hooks", rawData:d, regenBtnId:"btnTkHooks"
      });
    }catch(e){setContent("card-tkhooks-result",errHTML(e.message));}
  });

  /* TikTok : calendrier de contenu */
  content.querySelector("#btnTkCal")?.addEventListener("click",async()=>{
    const niche=content.querySelector("#tkcNiche")?.value||"";
    const frequency=(content.querySelector("#tkcFreq")?.value||"").trim();
    setContent("card-tkcal-result",spinnerHTML(T("tkc_spin")));
    try{
      const d=await sendBG({action:"tiktok_tool",tool:"calendar",niche,frequency,language:currentLanguage});
      const sch=d.schedule||[];
      if(!sch.length){setContent("card-tkcal-result",errHTML(T("error_generic")));return;}
      renderPremiumList("card-tkcal-result",{
        icon:"📅", label:T("tkc_ready")||"Calendrier prêt", sub:`${sch.length} ${T("tk_days")||"jours"}`,
        items:sch.map(s=>({
          head:`${esc(s.day||"")}${s.best_time?` · ${esc(s.best_time)}`:""}`,
          body:`<div>${esc(s.idea||"")}</div>${s.format?`<span class="echo-badge echo-badge-purple" style="margin-top:4px;">${esc(s.format)}</span>`:""}${s.hook?`<div style="margin-top:4px;">🪝 ${esc(s.hook)}</div>`:""}`,
          text:`${s.day||""}${s.best_time?" ("+s.best_time+")":""}: ${s.idea||""} [${s.format||""}]${s.hook?" - "+s.hook:""}`
        })),
        filenamePrefix:"tiktok-calendrier", rawData:d, regenBtnId:"btnTkCal"
      });
    }catch(e){setContent("card-tkcal-result",errHTML(e.message));}
  });

  /* Analyse des commentaires */
  content.querySelector("#btnComments")?.addEventListener("click",async()=>{
    setContent("card-comments-result",spinnerHTML(T("com_loading")));
    try{
      const r=await sendBG({action:"comments",videoId:data.videoId,title:data.title,language:currentLanguage});
      if(r.empty){ setContent("card-comments-result",`<div style="color:#888;font-size:12px;margin-top:8px;">${T("com_none")}</div>`); return; }
      const s=r.sentiment||{};
      const bar=(label,val,color)=>`<div style="display:flex;align-items:center;gap:6px;margin:2px 0;"><span style="font-size:11px;color:#aaa;width:60px;">${label}</span><div style="flex:1;height:8px;background:#1a1a1a;border-radius:4px;overflow:hidden;"><div style="width:${val||0}%;height:100%;background:${color};"></div></div><span style="font-size:11px;color:${color};width:32px;">${val||0}%</span></div>`;
      const list=(arr,ic,c)=>(arr||[]).map(x=>`<div style="font-size:12px;color:${c};margin:2px 0;">${ic} ${esc(x)}</div>`).join("");
      const replies=(r.suggested_replies||[]).map(rp=>`
        <div style="background:#0e0e12;border:1px solid #2a2a35;border-radius:8px;padding:8px;margin:6px 0;">
          <div style="font-size:11px;color:#888;font-style:italic;">💬 ${esc(rp.comment||"")}</div>
          <div style="font-size:12px;color:#e8e8f0;margin-top:4px;">↳ ${esc(rp.reply||"")}</div>
          <button class="echo-copy-mini echo-copy-reply" data-txt="${esc(rp.reply||"")}" style="margin-top:6px;width:auto;padding:4px 10px;">⧉ ${T("com_copy")}</button>
        </div>`).join("");
      setContent("card-comments-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="font-size:11px;color:#aaa;margin-bottom:4px;">${T("com_sentiment")} (${r.count||0} ${T("nav_comments").toLowerCase()})</div>
          ${bar(T("com_pos"),s.positive,"#22c55e")}
          ${bar(T("com_neu"),s.neutral,"#888")}
          ${bar(T("com_neg"),s.negative,"#ef4444")}
          <div style="font-size:13px;color:#e8e8f0;line-height:1.5;margin:8px 0;">${esc(r.summary||"")}</div>
          ${r.requests?.length?`<div style="font-size:11px;color:#eab308;font-weight:700;margin-top:8px;">${T("com_requests")}</div>${list(r.requests,"•","#ccc")}`:""}
          ${r.video_ideas?.length?`<div style="font-size:11px;color:#7c6dfa;font-weight:700;margin-top:8px;">${T("com_ideas")}</div>${list(r.video_ideas,"💡","#ccc")}`:""}
          ${replies?`<div style="font-size:11px;color:#22c55e;font-weight:700;margin-top:10px;">${T("com_replies")}</div>${replies}`:""}
        </div>`);
      content.querySelectorAll(".echo-copy-reply").forEach(b=>{
        b.addEventListener("click",e=>{navigator.clipboard.writeText(e.currentTarget.dataset.txt||"");showToast(T("copied_title"));});
      });
    }catch(e){setContent("card-comments-result",errHTML(e.message));}
  });

  /* Tableau de bord chaîne */
  content.querySelector("#btnChannelDash")?.addEventListener("click",async()=>{
    setContent("card-channel-result",spinnerHTML(T("spin_channel")));
    try{
      let cid=extractYouTubeChannelId();
      if(!cid){ const v=await sendBG({action:"yt_video",videoId:data.videoId}); cid=v&&v.channel_id; }
      if(!cid) throw new Error(T("err_channel"));
      const a=await sendBG({action:"channel_audit",channelId:cid});
      const cell=(v,l)=>`<div class="echo-rs-cell"><b>${v}</b><span>${l}</span></div>`;
      setContent("card-channel-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:8px;">${esc((a.channel||"").slice(0,40))}</div>
          <div class="echo-rs-grid">
            ${cell(fmtNum(a.subs),T("chan_subs"))}
            ${cell(fmtNum(a.total_views),T("chan_views"))}
            ${cell(fmtNum(a.total_videos),T("chan_vids"))}
            ${cell(fmtNum(a.avg_views),T("chan_avg"))}
            ${cell((a.avg_engagement||0)+"%",T("chan_eng"))}
            ${cell(a.upload_freq_days?a.upload_freq_days+"j":"—",T("chan_freq"))}
          </div>
          ${a.best_video?`<div style="margin-top:8px;font-size:11px;color:#22c55e">🏆 ${esc((a.best_video.title||"").slice(0,45))} — ${fmtNum(a.best_video.views)} ${T("chan_views").toLowerCase()}</div>`:""}
          ${a.worst_video?`<div style="margin-top:2px;font-size:11px;color:#ef4444">📉 ${esc((a.worst_video.title||"").slice(0,45))} — ${fmtNum(a.worst_video.views)}</div>`:""}
          <div id="channelAiReport" style="margin-top:10px;color:#888;font-size:12px;">⏳ ${T("chan_ai_loading")}</div>
        </div>`);
      // Rapport IA (santé + recommandations)
      try{
        const rep=await sendBG({action:"channel_report",stats:a,language:currentLanguage});
        const hc=scoreColor(rep.health_score||50);
        const list=(arr,c,ic)=>(arr||[]).map(x=>`<div style="font-size:12px;color:${c};margin:2px 0;">${ic} ${esc(x)}</div>`).join("");
        setContent("channelAiReport",`
          <div style="border-top:1px solid #2a2a35;padding-top:10px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <div style="font-size:26px;font-weight:800;color:${hc}">${rep.health_score??"—"}</div>
              <div><div style="font-size:11px;color:#aaa;">${T("chan_health")}</div><div style="font-size:12px;color:#e8e8f0;">${esc(rep.summary||"")}</div></div>
            </div>
            ${rep.strengths?.length?`<div style="font-size:11px;color:#22c55e;font-weight:700;margin-top:6px;">${T("chan_strengths")}</div>${list(rep.strengths,"#9fe6b0","✓")}`:""}
            ${rep.weaknesses?.length?`<div style="font-size:11px;color:#ef4444;font-weight:700;margin-top:6px;">${T("chan_weak")}</div>${list(rep.weaknesses,"#e69f9f","✗")}`:""}
            ${rep.recommendations?.length?`<div style="font-size:11px;color:#7c6dfa;font-weight:700;margin-top:6px;">${T("chan_reco")}</div>${list(rep.recommendations,"#ccc","→")}`:""}
          </div>`);
      }catch(e2){ setContent("channelAiReport",`<div style="color:#888;font-size:11px;">${T("chan_ai_fail")}</div>`); }
    }catch(e){setContent("card-channel-result",errHTML(e.message));}
  });

  /* Kit Sponsor & Monétisation */
  content.querySelector("#btnSponsor")?.addEventListener("click",async()=>{
    const niche=content.querySelector("#spNiche")?.value||"";
    const region=content.querySelector("#spRegion")?.value||"";
    const subscribers=parseSubs(content.querySelector("#spSubs")?.value||"");
    const avg_views=parseSubs(content.querySelector("#spViews")?.value||"");
    setContent("card-sponsor-result",spinnerHTML(T("spin_sponsor")));
    try{
      const r=await sendBG({action:"sponsor",niche,region,subscribers,avg_views,language:currentLanguage});
      const rate=r.rate_usd||{};
      const list=(arr,ic,c)=>(arr||[]).map(x=>`<div style="font-size:12px;color:${c};margin:2px 0;">${ic} ${esc(x)}</div>`).join("");
      setContent("card-sponsor-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="text-align:center;border:1px solid #22c55e;border-radius:10px;padding:10px;margin-bottom:10px;">
            <div style="font-size:10px;color:#888;">${T("sp_rate")}</div>
            <div style="font-size:22px;font-weight:800;color:#22c55e;">$${fmtNum(rate.low||0)} – $${fmtNum(rate.high||0)}</div>
            <div style="font-size:10px;color:#777;margin-top:2px;">${esc(r.rate_basis||"")}</div>
          </div>
          <div style="font-size:11px;color:#7c6dfa;font-weight:700;margin-bottom:2px;">${T("sp_pitch")}</div>
          <textarea readonly style="width:100%;box-sizing:border-box;background:#0e0e12;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;min-height:110px;resize:vertical;">${esc(r.pitch||"")}</textarea>
          <button class="echo-action-btn blue" id="btnCopyPitch" data-txt="${esc(r.pitch||"")}" style="margin-top:6px;">📋 ${T("sp_copy_pitch")}</button>
          ${r.media_kit?.length?`<div style="font-size:11px;color:#eab308;font-weight:700;margin-top:10px;">${T("sp_mediakit")}</div>${list(r.media_kit,"•","#ccc")}`:""}
          ${r.brand_types?.length?`<div style="font-size:11px;color:#3b82f6;font-weight:700;margin-top:8px;">${T("sp_brands")}</div>${list(r.brand_types,"🏢","#ccc")}`:""}
          ${r.affiliate_ideas?.length?`<div style="font-size:11px;color:#ec4899;font-weight:700;margin-top:8px;">${T("sp_affiliate")}</div>${list(r.affiliate_ideas,"🔗","#ccc")}`:""}
          <div style="font-size:10px;color:#666;margin-top:10px;font-style:italic;">${T("sp_disclaimer")}</div>
        </div>`);
      content.querySelector("#btnCopyPitch")?.addEventListener("click",e=>{navigator.clipboard.writeText(e.currentTarget.dataset.txt||"");showToast(T("copied_title"));});
    }catch(e){setContent("card-sponsor-result",errHTML(e.message));}
  });

  /* Estimateur vues + revenus */
  content.querySelector("#btnRevenue")?.addEventListener("click",async()=>{
    const t=(content.querySelector("#revTitle")?.value||"").trim();
    const niche=(content.querySelector("#revNiche")?.value||"").trim();
    const region=(content.querySelector("#revRegion")?.value||"").trim();
    const subscribers=parseSubs(content.querySelector("#revSubs")?.value||"");
    setContent("card-revenue-result",spinnerHTML("💰 Estimation en cours…"));
    try{
      const r=await sendBG({action:"revenue",title:t,niche,region,subscribers,language:currentLanguage});
      const v=r.views_7d||{}, rev=r.revenue_usd||{};
      const box=(label,low,exp,high,color,unit)=>`
        <div style="flex:1;border:1px solid ${color};border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:10px;color:#888;">${label}</div>
          <div style="font-size:20px;font-weight:800;color:${color};">${unit}${fmtNum(exp||0)}</div>
          <div style="font-size:10px;color:#777;">${unit}${fmtNum(low||0)} – ${unit}${fmtNum(high||0)}</div>
        </div>`;
      const list=arr=>(arr||[]).map(x=>`<div style="font-size:12px;color:#ccc;margin:2px 0;">• ${esc(x)}</div>`).join("");
      setContent("card-revenue-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            ${box(T("rev_views"),v.low,v.expected,v.high,"#3b82f6","")}
            ${box(T("rev_income"),rev.low,rev.expected,rev.high,"#22c55e","$")}
          </div>
          <div style="font-size:11px;color:#888;text-align:center;margin-bottom:10px;">RPM ≈ $${r.rpm_usd??"—"} / 1000 ${T("rev_views").toLowerCase()}</div>
          <div style="font-size:11px;color:#7c6dfa;font-weight:700;margin-bottom:2px;">${T("rev_factors")}</div>
          ${list(r.factors)}
          <div style="font-size:11px;color:#22c55e;font-weight:700;margin:10px 0 2px;">${T("rev_tips")}</div>
          ${list(r.tips)}
          <div style="font-size:10px;color:#666;margin-top:10px;font-style:italic;">${T("rev_disclaimer")}</div>
        </div>`);
    }catch(e){setContent("card-revenue-result",errHTML(e.message));}
  });

  /* Optimiseur d'audience (région/langue) */
  content.querySelector("#btnAudience")?.addEventListener("click",async()=>{
    const target=(content.querySelector("#audTarget")?.value||"").trim();
    const niche=(content.querySelector("#audNiche")?.value||"").trim();
    const contentLang=content.querySelector("#audLang")?.value||currentLanguage;
    setContent("card-audience-result",spinnerHTML(T("spin_audience")));
    try{
      const r=await sendBG({action:"audience",target,niche,content_language:contentLang,language:currentLanguage});
      const times=(r.best_times||[]).map(t=>`
        <div style="display:flex;gap:8px;align-items:baseline;margin:3px 0;">
          <span style="font-family:monospace;color:#7c6dfa;font-weight:700;white-space:nowrap;min-width:90px;">${esc(t.day||"")} ${esc(t.time||"")}</span>
          <span style="font-size:11px;color:#999;">${esc(t.reason||"")}</span>
        </div>`).join("");
      const chips=arr=>(arr||[]).map(x=>`<span class="echo-badge echo-badge-purple" style="margin:2px 3px 0 0;">${esc(x)}</span>`).join("");
      const list=arr=>(arr||[]).map(x=>`<div style="font-size:12px;color:#ccc;margin:2px 0;">• ${esc(x)}</div>`).join("");
      setContent("card-audience-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="font-size:12px;color:#aaa;margin-bottom:6px;">🎯 ${esc(r.target||target)} ${r.timezone?`· 🕓 ${esc(r.timezone)}`:""}</div>
          <div style="font-size:11px;color:#22c55e;font-weight:700;margin-bottom:2px;">${T("audience_times")}</div>
          ${times||`<div style="color:#888;font-size:12px;">—</div>`}
          <div style="font-size:11px;color:#7c6dfa;font-weight:700;margin:10px 0 2px;">${T("audience_trends")}</div>
          ${list(r.trends)}
          <div style="font-size:11px;color:#eab308;font-weight:700;margin:10px 0 4px;">${T("audience_hashtags")}</div>
          <div>${chips(r.hashtags)}</div>
          <div style="font-size:11px;color:#3b82f6;font-weight:700;margin:10px 0 2px;">${T("audience_topics")}</div>
          ${list(r.topic_ideas)}
          <div style="font-size:11px;color:#ec4899;font-weight:700;margin:10px 0 2px;">${T("audience_tips")}</div>
          ${list(r.tips)}
        </div>`);
    }catch(e){setContent("card-audience-result",errHTML(e.message));}
  });

  /* Audit complet en 1 clic (SEO + Miniature + Titre) */
  content.querySelector("#btnFullAudit")?.addEventListener("click",async()=>{
    setContent("card-audit1-result",spinnerHTML("⚡ Audit complet en cours…"));
    try{
      const [seo,thumb,td]=await Promise.all([
        sendBG({action:"seo_report",videoId:data.videoId,title:data.title,description:data.description,language:currentLanguage}).catch(()=>({})),
        sendBG({action:"thumbnail",videoId:data.videoId,title:data.title,language:currentLanguage}).catch(()=>({})),
        sendBG({action:"title_doctor",title:data.title,language:currentLanguage}).catch(()=>({}))
      ]);
      const nums=[seo.score,thumb.score,td.score].filter(n=>typeof n==="number");
      const global=nums.length?Math.round(nums.reduce((a,b)=>a+b,0)/nums.length):"—";
      const gc=scoreColor(global||0);
      // Plan d'action prioritaire
      const actions=[];
      (seo.suggestions||[]).slice(0,2).forEach(s=>actions.push(s));
      (td.missing||[]).slice(0,1).forEach(s=>actions.push(T("td_title")+" : "+s));
      (thumb.tips||[]).slice(0,1).forEach(s=>actions.push(T("nav_thumbnail")+" : "+s));
      const sub=(label,val)=>`<div style="flex:1;text-align:center;"><div style="font-size:18px;font-weight:800;color:${scoreColor(val||0)}">${val??"—"}</div><div style="font-size:10px;color:#888;">${label}</div></div>`;
      setContent("card-audit1-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
            <div style="font-size:30px;font-weight:800;color:${gc}">${global}<span style="font-size:13px;color:#666;">/100</span></div>
            <div style="font-size:11px;color:#aaa;">${T("au_global")}</div>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:10px;">
            ${sub(T("score_seo"),seo.score)}${sub(T("score_thumb"),thumb.score)}${sub(T("td_title"),td.score)}
          </div>
          ${seo.viral_reason?`<div style="font-size:12px;color:#ccc;margin-bottom:8px;">${esc(seo.viral_reason)}</div>`:""}
          ${actions.length?`<div style="font-size:11px;color:#22c55e;font-weight:700;margin-bottom:2px;">${T("au_plan")}</div>${actions.map((a,i)=>`<div style="font-size:12px;color:#e8e8f0;margin:2px 0;">${i+1}. ${esc(a)}</div>`).join("")}`:""}
          ${td.improved?`<div style="font-size:11px;color:#7c6dfa;font-weight:700;margin-top:8px;">${T("td_improved")}</div><div class="echo-title-result" data-title="${esc(td.improved)}"><div class="echo-title-result-body"><div class="echo-title-result-text">${esc(td.improved)}</div></div><button class="echo-copy-mini">⧉</button></div>`:""}
        </div>`);
      content.querySelectorAll("#card-audit1-result .echo-copy-mini").forEach(b=>b.addEventListener("click",()=>{navigator.clipboard.writeText(b.closest(".echo-title-result").dataset.title);showToast(T("copied_title"));}));
    }catch(e){setContent("card-audit1-result",errHTML(e.message));}
  });

  /* Hook Analyzer (rétention) */
  content.querySelector("#btnHookAnalyze")?.addEventListener("click",async()=>{
    const script=(content.querySelector("#hookScript")?.value||"").trim();
    if(script.length<10){ showToast(T("hook_need")); return; }
    setContent("card-hook-result",spinnerHTML(T("spin_hook")));
    try{
      const r=await sendBG({action:"hook",script,language:currentLanguage});
      const rc=scoreColor(r.retention_estimate||50), hc=scoreColor(r.hook_score||50);
      const drops=(r.drop_points||[]).map(d=>`
        <div style="border-left:3px solid ${d.severity==='high'?'#ef4444':'#eab308'};padding:6px 8px;margin:6px 0;background:#0e0e12;border-radius:0 6px 6px 0;">
          <div style="font-size:12px;color:#e8e8f0;font-style:italic;">"${esc(d.quote||"")}"</div>
          <div style="font-size:11px;color:#999;margin-top:2px;">⚠ ${esc(d.reason||"")}</div>
        </div>`).join("");
      setContent("card-hook-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="display:flex;gap:10px;margin-bottom:10px;">
            <div style="flex:1;text-align:center;border:1px solid ${rc};border-radius:8px;padding:8px;">
              <div style="font-size:22px;font-weight:800;color:${rc}">${r.retention_estimate??"—"}%</div>
              <div style="font-size:10px;color:#888;">${T("hook_retention")}</div>
            </div>
            <div style="flex:1;text-align:center;border:1px solid ${hc};border-radius:8px;padding:8px;">
              <div style="font-size:22px;font-weight:800;color:${hc}">${r.hook_score??"—"}/100</div>
              <div style="font-size:10px;color:#888;">${T("hook_score_label")}</div>
            </div>
          </div>
          <div style="font-size:13px;color:#e8e8f0;line-height:1.5;margin-bottom:10px;">${esc(r.verdict||"")}</div>
          ${drops?`<div style="font-size:11px;color:#ef4444;margin-bottom:2px;font-weight:700;">${T("hook_drops")}</div>${drops}`:""}
          ${(r.fixes&&r.fixes.length)?`<div style="font-size:11px;color:#22c55e;margin:8px 0 2px;font-weight:700;">${T("hook_fixes")}</div>${r.fixes.map(f=>`<div style="font-size:12px;color:#ccc;margin:2px 0;">✓ ${esc(f)}</div>`).join("")}`:""}
          ${r.rewritten_hook?`
            <div style="border-top:1px solid #2a2a35;padding-top:10px;margin-top:10px;">
              <div style="font-size:11px;color:#7c6dfa;margin-bottom:4px;">${T("hook_rewrite")}</div>
              <div class="echo-title-result" data-title="${esc(r.rewritten_hook)}">
                <div class="echo-title-result-body"><div class="echo-title-result-text">${esc(r.rewritten_hook)}</div></div>
                <button class="echo-copy-mini">⧉</button>
              </div>
            </div>`:""}
        </div>`);
      content.querySelectorAll("#card-hook-result .echo-copy-mini").forEach(b=>{
        b.addEventListener("click",()=>{navigator.clipboard.writeText(b.closest(".echo-title-result").dataset.title);showToast(T("copied_title"));});
      });
    }catch(e){setContent("card-hook-result",errHTML(e.message));}
  });

  /* Titres IA */
  content.querySelector("#btnLoadTitles")?.addEventListener("click",async()=>{
    setContent("card-titles-content",spinnerHTML(T("loading_titles")));
    try{
      const res=await sendBG({action:"titles",videoId:data.videoId,title:data.title,description:data.description,language:currentLanguage});
      const html=(res.titles||[]).map((t,i)=>`
        <div class="echo-title-result" data-title="${esc(t.text)}">
          <span class="echo-title-result-num">${i+1}</span>
          <div class="echo-title-result-body">
            <div class="echo-title-result-text">${esc(t.text)}</div>
            <div class="echo-title-result-meta">
              <span class="echo-badge" style="background:${scoreColor(t.score||75)}22;color:${scoreColor(t.score||75)}">${t.score||"—"}/100</span>
              ${t.hook?`<span class="echo-badge echo-badge-purple">${esc(t.hook)}</span>`:""}
            </div>
          </div>
          <button class="echo-copy-mini">⧉</button>
        </div>`).join("")||`<div style="color:#888">${T("error_generic")}</div>`;
      // Aperçu gratuit : titres verrouillés floutés + CTA pour passer à Pro
      let lockedBlock="";
      if(res.preview && res.locked>0){
        const fakeRows=Array.from({length:res.locked}).map((_,i)=>`
          <div class="echo-title-result">
            <span class="echo-title-result-num">${i+2}</span>
            <div class="echo-title-result-body">
              <div class="echo-title-result-text">Titre optimisé Pro #${i+2} — exemple masqué</div>
              <div class="echo-title-result-meta"><span class="echo-badge echo-badge-purple">Pro</span></div>
            </div>
          </div>`).join("");
        lockedBlock=`
          <div style="position:relative;margin-top:8px;border-radius:12px;overflow:hidden;">
            <div style="filter:blur(6px);opacity:.7;pointer-events:none;user-select:none;">${fakeRows}</div>
            <div class="echo-locked-overlay" style="position:absolute;inset:0;">
              <div class="echo-locked-icon">🔒</div>
              <div class="echo-locked-title">${T("lk_more").replace("{n}",res.locked)}</div>
              <div class="echo-locked-sub">${T("lk_all")}</div>
              <button class="echo-locked-btn" id="btnUnlockTitles">⭐ ${T("upgrade_btn")}</button>
            </div>
          </div>`;
      }
      setContent("card-titles-content",`
        <div class="echo-card-head">${T("nav_titles")} <span class="echo-badge echo-badge-ai">${T("badge_ai")}</span>${res.preview?' <span class="echo-badge" style="background:rgba(34,197,94,.15);color:#22c55e">${T("lk_preview")}</span>':''}</div>
        ${html}
        ${lockedBlock}`);
      content.querySelectorAll(".echo-copy-mini").forEach(b=>{
        b.addEventListener("click",()=>{
          navigator.clipboard.writeText(b.closest(".echo-title-result").dataset.title);
          showToast(T("copied_title"));
        });
      });
      document.getElementById("btnUnlockTitles")?.addEventListener("click",()=>window.open("https://vidsparkpro.com/billing","_blank"));
    }catch(e){setContent("card-titles-content",errHTML(e.message));}
  });

  /* A/B Test */
  content.querySelector("#btnRunABTest")?.addEventListener("click",async()=>{
    const ta=document.getElementById("abTitleA"), tb=document.getElementById("abTitleB");
    const titleA=(ta?.value||"").trim(), titleB=(tb?.value||"").trim();
    if(!titleA||!titleB){ showToast(T("abtest_need2")); return; }
    setContent("card-abtest-result",spinnerHTML(T("spin_abtest")));
    try{
      const r=await sendBG({action:"abtest",titleA,titleB,language:currentLanguage});
      const win=r.winner==="A"?"A":"B";
      const wc="#22c55e", lc="#888";
      const card=(label,v,isWin)=>`
        <div style="flex:1;border:1px solid ${isWin?wc:'#2a2a35'};border-radius:10px;padding:10px;background:${isWin?'rgba(34,197,94,.08)':'transparent'}">
          <div style="font-size:11px;color:#aaa;margin-bottom:4px;">${label} ${isWin?`<span style="color:${wc};font-weight:700">★ ${T("abtest_winner")}</span>`:""}</div>
          <div style="font-size:22px;font-weight:800;color:${isWin?wc:lc}">${v?.ctr_estimate??"—"}%</div>
          <div style="font-size:10px;color:#777;">${T("abtest_ctr")} · ${v?.score??"—"}/100</div>
          ${(v?.strengths||[]).map(s=>`<div style="font-size:11px;color:#9fe6b0;margin-top:3px;">✓ ${esc(s)}</div>`).join("")}
          ${(v?.weaknesses||[]).map(s=>`<div style="font-size:11px;color:#e69f9f;margin-top:3px;">✗ ${esc(s)}</div>`).join("")}
        </div>`;
      setContent("card-abtest-result",`
        <div class="echo-card">
          <div class="echo-card-head">🏆 ${T("result_label")} — ${T("abtest_confidence")}: ${r.confidence??"—"}%</div>
          <div style="display:flex;gap:8px;margin-bottom:10px;">
            ${card(T("abtest_a"),r.a,win==="A")}
            ${card(T("abtest_b"),r.b,win==="B")}
          </div>
          <div style="font-size:11px;color:#aaa;margin-bottom:3px;">${T("abtest_verdict")}</div>
          <div style="font-size:13px;color:#e8e8f0;line-height:1.5;margin-bottom:12px;">${esc(r.verdict||"")}</div>
          ${r.improved?`
            <div style="border-top:1px solid #2a2a35;padding-top:10px;">
              <div style="font-size:11px;color:#7c6dfa;margin-bottom:4px;">${T("abtest_improved")}</div>
              <div class="echo-title-result" data-title="${esc(r.improved)}">
                <div class="echo-title-result-body"><div class="echo-title-result-text">${esc(r.improved)}</div></div>
                <button class="echo-copy-mini">⧉</button>
              </div>
            </div>`:""}
        </div>`);
      content.querySelectorAll("#card-abtest-result .echo-copy-mini").forEach(b=>{
        b.addEventListener("click",()=>{navigator.clipboard.writeText(b.closest(".echo-title-result").dataset.title);showToast(T("copied_title"));});
      });
    }catch(e){setContent("card-abtest-result",errHTML(e.message));}
  });

  /* Thumbnail A/B : aperçu des fichiers choisis */
  const bindThumbPick=(inputId,prevId)=>{
    const inp=content.querySelector("#"+inputId);
    inp?.addEventListener("change",async()=>{
      const f=inp.files?.[0]; if(!f) return;
      try{
        const b64=await fileToScaledBase64(f);
        inp._b64=b64;
        const p=content.querySelector("#"+prevId);
        if(p) p.innerHTML=`<img src="data:image/jpeg;base64,${b64}" style="max-width:100%;max-height:70px;border-radius:6px;">`;
      }catch(e){ showToast(e.message); }
    });
  };
  bindThumbPick("fileThumbA","prevThumbA");
  bindThumbPick("fileThumbB","prevThumbB");

  content.querySelector("#btnRunThumbAB")?.addEventListener("click",async()=>{
    const a=content.querySelector("#fileThumbA")?._b64, b=content.querySelector("#fileThumbB")?._b64;
    if(!a||!b){ showToast(T("thumbab_need2")); return; }
    setContent("card-thumbab-result",spinnerHTML(T("spin_thumbab")));
    try{
      const r=await sendBG({action:"thumbnail_ab",imageA:a,imageB:b,language:currentLanguage});
      const win=r.winner==="A"?"A":"B";
      const wc="#22c55e", lc="#888";
      const imgs={A:a,B:b};
      const card=(label,v,key,isWin)=>`
        <div style="flex:1;border:1px solid ${isWin?wc:'#2a2a35'};border-radius:10px;padding:10px;background:${isWin?'rgba(34,197,94,.08)':'transparent'}">
          <img src="data:image/jpeg;base64,${imgs[key]}" style="width:100%;border-radius:6px;margin-bottom:6px;">
          <div style="font-size:11px;color:#aaa;margin-bottom:4px;">${label} ${isWin?`<span style="color:${wc};font-weight:700">★ ${T("abtest_winner")}</span>`:""}</div>
          <div style="font-size:22px;font-weight:800;color:${isWin?wc:lc}">${v?.ctr_estimate??"—"}%</div>
          <div style="font-size:10px;color:#777;">${T("abtest_ctr")} · ${v?.score??"—"}/100</div>
          ${(v?.strengths||[]).map(s=>`<div style="font-size:11px;color:#9fe6b0;margin-top:3px;">✓ ${esc(s)}</div>`).join("")}
          ${(v?.weaknesses||[]).map(s=>`<div style="font-size:11px;color:#e69f9f;margin-top:3px;">✗ ${esc(s)}</div>`).join("")}
        </div>`;
      setContent("card-thumbab-result",`
        <div class="echo-card">
          <div class="echo-card-head">🏆 ${T("result_label")} — ${T("abtest_confidence")}: ${r.confidence??"—"}%</div>
          <div style="display:flex;gap:8px;margin-bottom:10px;">
            ${card(T("thumbab_a"),r.a,"A",win==="A")}
            ${card(T("thumbab_b"),r.b,"B",win==="B")}
          </div>
          <div style="font-size:11px;color:#aaa;margin-bottom:3px;">${T("abtest_verdict")}</div>
          <div style="font-size:13px;color:#e8e8f0;line-height:1.5;margin-bottom:10px;">${esc(r.verdict||"")}</div>
          ${(r.tips&&r.tips.length)?`
            <div style="border-top:1px solid #2a2a35;padding-top:8px;">
              <div style="font-size:11px;color:#7c6dfa;margin-bottom:4px;">${T("thumbab_tips")}</div>
              ${r.tips.map(t=>`<div style="font-size:12px;color:#ccc;margin:2px 0;">• ${esc(t)}</div>`).join("")}
            </div>`:""}
          ${r.improve_prompt?`
            <div style="border-top:1px solid #2a2a35;padding-top:10px;margin-top:8px;">
              <div style="font-size:11px;color:#22c55e;margin-bottom:4px;">${T("thumbab_prompt_label")}</div>
              <textarea id="improvePromptBox" readonly style="width:100%;box-sizing:border-box;background:#0e0e12;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;min-height:80px;resize:vertical;">${esc(r.improve_prompt)}</textarea>
              <button class="echo-action-btn green" id="btnCopyImprovePrompt" data-prompt="${esc(r.improve_prompt)}">📋 ${T("thumbab_prompt_copy")}</button>
              <div style="font-size:10px;color:#777;margin-top:4px;">${T("thumbab_prompt_hint")}</div>
            </div>`:""}
        </div>`);
      // Copier le prompt détaillé pour le coller dans une autre IA
      content.querySelector("#btnCopyImprovePrompt")?.addEventListener("click",(ev)=>{
        navigator.clipboard.writeText(ev.currentTarget.dataset.prompt||"");
        showToast(T("copied_title"));
      });
    }catch(e){setContent("card-thumbab-result",errHTML(e.message));}
  });

  /* Shorts Generator */
  content.querySelector("#btnGenShorts")?.addEventListener("click",async()=>{
    setContent("card-shorts-result",spinnerHTML("📜 Lecture des sous-titres…"));
    let transcript="";
    try{ transcript=await getYouTubeTranscript(data.videoId); }catch(e){}
    setContent("card-shorts-result",spinnerHTML(transcript?T("spin_shorts_real"):T("spin_shorts")));
    try{
      const r=await sendBG({action:"shorts",videoId:data.videoId,title:data.title,description:data.description,language:currentLanguage,transcript});
      const shorts=r.shorts||[];
      const cards=shorts.map((s,i)=>{
        const sc=scoreColor(s.viral_score||70);
        const clips=s.clips||[];
        const clipsText=clips.map(c=>`${c.start||"?"} → ${c.end||"?"}${c.reason?" ("+c.reason+")":""}`).join("\n");
        const scriptText=(s.script||[]).join("\n");
        const copyText=`${s.title||""}\n${s.summary?s.summary+"\n":""}\n${T("shorts_clips")}:\n${clipsText}\n\n${T("shorts_script")}:\n${scriptText}`;
        const estBadge=clips.length?`<span class="echo-badge" style="background:${s.estimated?'rgba(245,179,1,.15)':'rgba(34,197,94,.15)'};color:${s.estimated?'#f5b301':'#22c55e'};font-size:9px;">${s.estimated?T("shorts_estimated"):T("shorts_real")}</span>`:"";
        return `
          <div class="echo-card" data-copy="${esc(copyText)}">
            <div class="echo-card-head" style="display:flex;justify-content:space-between;align-items:center;">
              <span>📱 ${esc(s.title||("Short #"+(i+1)))}</span>
              <span class="echo-badge" style="background:${sc}22;color:${sc}">${s.viral_score||"—"}/100</span>
            </div>
            ${s.summary?`<div style="font-size:12px;color:#bbb;margin-bottom:8px;">📝 ${esc(s.summary)}</div>`:""}
            ${clips.length?`
              <div style="background:#0e0e12;border:1px solid #2a2a35;border-radius:8px;padding:8px;margin-bottom:8px;">
                <div style="font-size:11px;color:#f5b301;margin-bottom:4px;font-weight:700;">${T("shorts_clips")} ${estBadge}</div>
                ${clips.map(c=>`
                  <div style="font-size:12px;color:#e8e8f0;margin:3px 0;display:flex;gap:6px;align-items:baseline;">
                    <span style="font-family:monospace;color:#7c6dfa;font-weight:700;white-space:nowrap;">${esc(c.start||"?")} → ${esc(c.end||"?")}</span>
                    ${c.reason?`<span style="color:#999;font-size:11px;">${esc(c.reason)}</span>`:""}
                  </div>`).join("")}
              </div>`:""}
            <div style="font-size:11px;color:#7c6dfa;margin-bottom:2px;">${T("shorts_hook")}</div>
            <div style="font-size:13px;color:#e8e8f0;margin-bottom:8px;font-style:italic;">"${esc(s.hook||"")}"</div>
            <div style="font-size:11px;color:#aaa;margin-bottom:2px;">${T("shorts_script")} · ${T("shorts_duration")}: ${esc(s.duration||"30s")}</div>
            ${(s.script||[]).map((p,j)=>`<div style="font-size:12px;color:#ccc;margin:2px 0;">${j+1}. ${esc(p)}</div>`).join("")}
            <div style="margin-top:6px;">${(s.hashtags||[]).map(h=>`<span class="echo-badge echo-badge-purple" style="margin:2px 3px 0 0;">${esc(h)}</span>`).join("")}</div>
            <button class="echo-copy-mini echo-copy-script" style="margin-top:8px;width:auto;padding:4px 10px;">⧉ ${T("shorts_copy")}</button>
          </div>`;
      }).join("");
      let lockedBlock="";
      if(r.preview && r.locked>0){
        lockedBlock=`
          <div style="position:relative;margin-top:8px;border-radius:12px;overflow:hidden;">
            <div style="filter:blur(6px);opacity:.6;pointer-events:none;" class="echo-card">
              <div class="echo-card-head">📱 ${T("lk_hidden")}</div>
            </div>
            <div class="echo-locked-overlay" style="position:absolute;inset:0;">
              <div class="echo-locked-icon">🔒</div>
              <div class="echo-locked-title">${T("lk_more").replace("{n}",r.locked)}</div>
              <div class="echo-locked-sub">${T("lk_all")}</div>
              <button class="echo-locked-btn" id="btnUnlockShorts">⭐ ${T("upgrade_btn")}</button>
            </div>
          </div>`;
      }
      setContent("card-shorts-result",cards+lockedBlock || `<div style="color:#888">${T("error_generic")}</div>`);
      content.querySelectorAll(".echo-copy-script").forEach(b=>{
        b.addEventListener("click",()=>{
          const c=b.closest("[data-copy]");
          navigator.clipboard.writeText(c.dataset.copy||"");
          showToast(T("copied_title"));
        });
      });
      document.getElementById("btnUnlockShorts")?.addEventListener("click",()=>window.open("https://vidsparkpro.com/billing","_blank"));
    }catch(e){setContent("card-shorts-result",errHTML(e.message));}
  });

  /* Title Doctor — score CTR en direct (côté navigateur) */
  const tdUpdate=()=>{
    const v=content.querySelector("#tdInput")?.value||"";
    const {score,checks}=computeTitleScore(v);
    const c=scoreColor(score);
    const bar=content.querySelector("#tdBar"); if(bar){bar.style.width=score+"%";bar.style.background=c;}
    const sc=content.querySelector("#tdScore"); if(sc){sc.textContent=score;sc.style.color=c;}
    const ch=content.querySelector("#tdChecks");
    if(ch) ch.innerHTML=checks.map(x=>`<span class="echo-badge" title="${esc(x.tip||"")}" style="cursor:help;background:${x.ok?'rgba(34,197,94,.15)':'rgba(136,136,136,.12)'};color:${x.ok?'#22c55e':'#888'};">${x.ok?'✓':'○'} ${esc(x.label)} ?</span>`).join("");
  };
  const tdEl=content.querySelector("#tdInput");
  if(tdEl){ ["input","keyup","change","paste"].forEach(ev=>tdEl.addEventListener(ev,()=>setTimeout(tdUpdate,0))); tdUpdate(); }

  content.querySelector("#btnTitleDoctor")?.addEventListener("click",async()=>{
    tdUpdate(); // recalcule le score instantané au clic
    const v=(content.querySelector("#tdInput")?.value||"").trim();
    if(v.length<3){ showToast(T("td_need")); return; }
    setContent("card-td-result",spinnerHTML("🩺 Diagnostic IA…"));
    try{
      const r=await sendBG({action:"title_doctor",title:v,language:currentLanguage});
      setContent("card-td-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="display:flex;gap:10px;margin-bottom:8px;">
            <div style="flex:1;text-align:center;"><div style="font-size:20px;font-weight:800;color:${scoreColor(r.score||50)}">${r.score??"—"}/100</div><div style="font-size:10px;color:#888;">${T("td_ai_score")}</div></div>
            <div style="flex:1;text-align:center;"><div style="font-size:20px;font-weight:800;color:#3b82f6">${r.ctr_estimate??"—"}%</div><div style="font-size:10px;color:#888;">${T("abtest_ctr")}</div></div>
          </div>
          ${(r.missing&&r.missing.length)?`<div style="font-size:11px;color:#eab308;font-weight:700;">${T("td_missing")}</div>${r.missing.map(m=>`<div style="font-size:12px;color:#ccc;margin:1px 0;">• ${esc(m)}</div>`).join("")}`:""}
          ${r.improved?`<div style="font-size:11px;color:#7c6dfa;font-weight:700;margin-top:8px;">${T("td_improved")}</div>
            <div class="echo-title-result" data-title="${esc(r.improved)}"><div class="echo-title-result-body"><div class="echo-title-result-text">${esc(r.improved)}</div></div><button class="echo-copy-mini">⧉</button></div>`:""}
          ${(r.tips&&r.tips.length)?`<div style="font-size:11px;color:#22c55e;font-weight:700;margin-top:8px;">${T("td_tips")}</div>${r.tips.map(t=>`<div style="font-size:12px;color:#ccc;margin:1px 0;">→ ${esc(t)}</div>`).join("")}`:""}
        </div>`);
      content.querySelectorAll("#card-td-result .echo-copy-mini").forEach(b=>b.addEventListener("click",()=>{navigator.clipboard.writeText(b.closest(".echo-title-result").dataset.title);showToast(T("copied_title"));}));
    }catch(e){setContent("card-td-result",errHTML(e.message));}
  });

  /* Localisation / traduction des métadonnées */
  content.querySelector("#btnTranslate")?.addEventListener("click",async()=>{
    const target_lang=content.querySelector("#trLang")?.value||"en";
    const title=(content.querySelector("#descTitle")?.value||data.title||"").trim();
    if(!title){ showToast(T("desc_need")); return; }
    setContent("card-translate-result",spinnerHTML("🌐 Traduction…"));
    try{
      const r=await sendBG({action:"translate",title,description:data.description||"",target_lang,language:currentLanguage});
      const tags=(r.tags||[]).join(", ");
      const full=`${r.title||""}\n\n${r.description||""}`;
      setContent("card-translate-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="font-size:11px;color:#aaa;">${T("tr_title")}</div>
          <div style="font-size:13px;color:#fff;font-weight:600;margin-bottom:6px;">${esc(r.title||"")}</div>
          <div style="font-size:11px;color:#aaa;">${T("tr_desc")}</div>
          <textarea readonly style="width:100%;box-sizing:border-box;background:#0e0e12;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;min-height:90px;resize:vertical;">${esc(r.description||"")}</textarea>
          ${tags?`<div style="font-size:11px;color:#eab308;font-weight:700;margin-top:8px;">${T("desc_tags")}</div><div style="font-size:12px;color:#ccc;">${esc(tags)}</div>`:""}
          <button class="echo-action-btn green" id="btnCopyTr" data-txt="${esc(full)}" style="margin-top:8px;">📋 ${T("tr_copy")}</button>
        </div>`);
      content.querySelector("#btnCopyTr")?.addEventListener("click",e=>{navigator.clipboard.writeText(e.currentTarget.dataset.txt||"");showToast(T("copied_title"));});
    }catch(e){setContent("card-translate-result",errHTML(e.message));}
  });

  /* Description complète (description + abonne-toi + hashtags + tags) */
  content.querySelector("#btnDescPack")?.addEventListener("click",async()=>{
    const t=(content.querySelector("#descTitle")?.value||"").trim();
    const niche=(content.querySelector("#descNiche")?.value||"").trim();
    const region=(content.querySelector("#descRegion")?.value||"").trim();
    if(!t){ showToast(T("desc_need")); return; }
    setContent("card-desc-result",spinnerHTML(T("spin_desc")));
    try{
      const r=await sendBG({action:"video_package",title:t,niche,region,language:currentLanguage});
      const full=`${r.description||""}\n\n${r.subscribe_cta||""}\n\n${(r.hashtags||[]).join(" ")}`.trim();
      setContent("card-desc-result",`
        <div class="echo-card" style="margin-top:8px;">
          <div style="font-size:11px;color:#22c55e;font-weight:700;margin-bottom:4px;">${T("desc_ready")}</div>
          <textarea readonly style="width:100%;box-sizing:border-box;background:#0e0e12;border:1px solid #2a2a35;border-radius:8px;color:#e8e8f0;padding:8px;font-size:12px;min-height:140px;resize:vertical;">${esc(full)}</textarea>
          <button class="echo-action-btn green" id="btnCopyDesc" data-txt="${esc(full)}">📋 ${T("desc_copy")}</button>
          <div style="font-size:11px;color:#eab308;font-weight:700;margin:10px 0 4px;">${T("desc_tags")}</div>
          <div>${(r.tags||[]).map(x=>`<span class="echo-badge echo-badge-purple" style="margin:2px 3px 0 0;">${esc(x)}</span>`).join("")}</div>
          <button class="echo-action-btn blue" id="btnCopyTags" data-txt="${esc((r.tags||[]).join(", "))}" style="margin-top:8px;">📋 ${T("desc_copy_tags")}</button>
        </div>`);
      content.querySelector("#btnCopyDesc")?.addEventListener("click",e=>{navigator.clipboard.writeText(e.currentTarget.dataset.txt||"");showToast(T("copied_title"));});
      content.querySelector("#btnCopyTags")?.addEventListener("click",e=>{navigator.clipboard.writeText(e.currentTarget.dataset.txt||"");showToast(T("copied_title"));});
    }catch(e){setContent("card-desc-result",errHTML(e.message));}
  });

  /* Actions */
  content.querySelector("#btnCopyTitle")?.addEventListener("click",()=>{
    navigator.clipboard.writeText(data.title);
    showToast(T("copied_title"));
  });
  content.querySelector("#btnOpenThumb")?.addEventListener("click",()=>{
    window.open(`https://i.ytimg.com/vi/${data.videoId}/maxresdefault.jpg`);
  });
  content.querySelector("#btnGenDesc")?.addEventListener("click",async()=>{
    showActionResult(T("act_desc_label"),spinnerHTML(T("loading_desc")));
    try{
      const res=await sendBG({action:"description",videoId:data.videoId,title:data.title,description:data.description,language:currentLanguage});
      const desc=res.description||"";
      const tags=(res.hashtags||[]).join(" ");
      showActionResult(T("act_desc_label"),`
        <div class="echo-result-text">${esc(desc)}</div>
        <div class="echo-result-tags">${esc(tags)}</div>
        <button class="echo-action-btn blue" id="btnCopyDesc">${T("act_copy_desc")}</button>`);
      document.getElementById("btnCopyDesc")?.addEventListener("click",()=>{
        navigator.clipboard.writeText(desc+"\n\n"+tags);
        showToast(T("copied_desc"));
      });
    }catch(e){showActionResult("Erreur",errHTML(e.message));}
  });
  content.querySelector("#btnGenTags")?.addEventListener("click",async()=>{
    showActionResult(T("act_tags_label"),spinnerHTML(T("loading_tags")));
    try{
      const res=await sendBG({action:"tags",videoId:data.videoId,title:data.title,description:data.description,language:currentLanguage});
      const tagsH=(res.tags||[]).map(t=>`<span class="echo-kw-tag">${esc(t)}</span>`).join("");
      const hashH=(res.hashtags||[]).map(h=>`<span class="echo-kw-tag hash">${esc(h)}</span>`).join("");
      const all=[...(res.tags||[]),...(res.hashtags||[])].join(", ");
      showActionResult(T("act_tags_label"),`
        <div class="echo-tag-section"><div class="echo-tag-section-label">${T("act_tags_yt")}</div><div class="echo-tag-cloud">${tagsH}</div></div>
        <div class="echo-tag-section"><div class="echo-tag-section-label">${T("act_hashtags")}</div><div class="echo-tag-cloud">${hashH}</div></div>
        <button class="echo-action-btn purple" id="btnCopyTags">${T("act_copy_tags")}</button>`);
      document.getElementById("btnCopyTags")?.addEventListener("click",()=>{
        navigator.clipboard.writeText(all);
        showToast(T("copied_tags"));
      });
    }catch(e){showActionResult("Erreur",errHTML(e.message));}
  });
}

function showActionResult(title,html){
  const card=document.getElementById("card-action-result");
  if(!card)return;
  document.getElementById("action-result-title").textContent=title;
  document.getElementById("action-result-content").innerHTML=html;
  card.style.display="block";
}

/* ── Shorts toggle ── */
/* ══════════════════════════════════════════════════════════════
   FENÊTRE FLOTTANTE — géométrie, drag, resize, masquer/rouvrir
   ──────────────────────────────────────────────────────────────
   Le panneau n'est plus injecté dans la colonne #secondary de YouTube : c'est
   une fenêtre position:fixed, déplaçable et redimensionnable, dont la taille
   et la position sont mémorisées d'une vidéo à l'autre (chrome.storage.local).
══════════════════════════════════════════════════════════════ */
const PANEL_GEOM_KEY = "vs_panel_geometry";

function getSavedGeometry(){
  return new Promise(resolve=>{
    try{
      chrome.storage.local.get(PANEL_GEOM_KEY, r=>resolve(r && r[PANEL_GEOM_KEY] || null));
    }catch(e){ resolve(null); }
  });
}
function savePanelGeometry(g){
  try{ chrome.storage.local.set({ [PANEL_GEOM_KEY]: g }); }catch(e){}
}
/* Applique une géométrie sauvegardée, bornée à la fenêtre actuelle (un écran
   plus petit que celui où la position a été enregistrée ne doit pas faire
   sortir le panneau de l'écran). */
function applyGeometry(panel, geom){
  if(!geom) return;
  const vw=window.innerWidth, vh=window.innerHeight;
  if(typeof geom.width==="number")  panel.style.width  = Math.min(Math.max(geom.width,480), vw-8)+"px";
  if(typeof geom.height==="number") panel.style.height = Math.min(Math.max(geom.height,380), vh-8)+"px";
  if(typeof geom.left==="number" && typeof geom.top==="number"){
    panel.style.left  = Math.max(0, Math.min(geom.left, vw-60))+"px";
    panel.style.top   = Math.max(0, Math.min(geom.top,  vh-40))+"px";
    panel.style.right = "auto";
  }
}

let _panelDrag=null, _panelResize=null, _panelChromeBound=false;

/* Glisser (en-tête, sauf sur les contrôles interactifs qu'elle contient) et
   redimensionner (coin bas-droit) ; les écouteurs window sont posés UNE SEULE
   fois pour tout le script — sinon chaque changement de vidéo (createPanel
   rappelé) en accumulerait un nouveau jeu sur `window`, qui ne se libère
   jamais tout seul contrairement au panneau qu'il pilote. */
function enablePanelChrome(panel){
  const header=panel.querySelector(".echo-header");
  const handle=panel.querySelector(".echo-resize-handle");
  const hideBtn=panel.querySelector("#echoPanelHide");

  if(header) header.addEventListener("mousedown", e=>{
    if(e.target.closest("button, select, a, input")) return;
    const r=panel.getBoundingClientRect();
    panel.style.left=r.left+"px"; panel.style.top=r.top+"px"; panel.style.right="auto";
    _panelDrag={panel,startX:e.clientX,startY:e.clientY,startLeft:r.left,startTop:r.top};
    header.classList.add("echo-dragging");
    document.body.style.userSelect="none";
  });

  if(handle) handle.addEventListener("mousedown", e=>{
    e.preventDefault();
    _panelResize={panel,startX:e.clientX,startY:e.clientY,startW:panel.offsetWidth,startH:panel.offsetHeight};
    document.body.style.userSelect="none";
  });

  if(hideBtn) hideBtn.addEventListener("click", ()=>{
    panel.classList.add("echo-panel-hidden");
    document.getElementById("echo-shorts-toggle")?.classList.remove("echo-toggle-hidden");
  });

  if(_panelChromeBound) return;
  _panelChromeBound=true;

  window.addEventListener("mousemove", e=>{
    if(_panelDrag){
      const vw=window.innerWidth, vh=window.innerHeight;
      const left=Math.max(0, Math.min(_panelDrag.startLeft+(e.clientX-_panelDrag.startX), vw-60));
      const top =Math.max(0, Math.min(_panelDrag.startTop +(e.clientY-_panelDrag.startY), vh-40));
      _panelDrag.panel.style.left=left+"px";
      _panelDrag.panel.style.top =top+"px";
    }
    if(_panelResize){
      const vw=window.innerWidth, vh=window.innerHeight;
      const w=Math.min(Math.max(480, _panelResize.startW+(e.clientX-_panelResize.startX)), vw-8);
      const h=Math.min(Math.max(380, _panelResize.startH+(e.clientY-_panelResize.startY)), vh-8);
      _panelResize.panel.style.width =w+"px";
      _panelResize.panel.style.height=h+"px";
    }
  });
  window.addEventListener("mouseup", ()=>{
    if(_panelDrag){
      _panelDrag.panel.querySelector(".echo-header")?.classList.remove("echo-dragging");
      document.body.style.userSelect="";
      savePanelGeometry({
        left:parseFloat(_panelDrag.panel.style.left)||0,
        top:parseFloat(_panelDrag.panel.style.top)||0,
        width:_panelDrag.panel.offsetWidth,
        height:_panelDrag.panel.offsetHeight
      });
      _panelDrag=null;
    }
    if(_panelResize){
      document.body.style.userSelect="";
      savePanelGeometry({
        left:parseFloat(_panelResize.panel.style.left)||_panelResize.panel.getBoundingClientRect().left,
        top:parseFloat(_panelResize.panel.style.top)||_panelResize.panel.getBoundingClientRect().top,
        width:_panelResize.panel.offsetWidth,
        height:_panelResize.panel.offsetHeight
      });
      _panelResize=null;
    }
  });
}

/* Bouton flottant pour rouvrir le panneau une fois masqué (bouton « – » de
   l'en-tête). Le clic relit le panneau courant dans le DOM au lieu de garder
   une référence fermée sur `panel` : createPanel() recrée un nouveau panneau
   à chaque changement de vidéo, une référence capturée à la création du
   bouton pointerait sur un panneau déjà retiré du DOM après la 2e vidéo. */
function addShortsToggle(panel){
  let btn=document.getElementById("echo-shorts-toggle");
  if(!btn){
    btn=document.createElement("button");
    btn.id="echo-shorts-toggle";
    btn.textContent="⚡";
    btn.title="VidSpark AI";
    btn.setAttribute("aria-label","VidSpark AI");
    document.body.appendChild(btn);
    btn.addEventListener("click",()=>{
      document.getElementById("echo-rank-panel")?.classList.remove("echo-panel-hidden");
      btn.classList.add("echo-toggle-hidden");
    });
  }
  btn.classList.add("echo-toggle-hidden");
}
function hidePanelToggle(){
  document.getElementById("echo-shorts-toggle")?.classList.add("echo-toggle-hidden");
}

/* ── Deep-link depuis le popup ──
   Le popup est une fenêtre séparée (aucune variable en commun) : il déclenche
   l'ouverture d'une section via un message runtime plutôt qu'un appel direct.
   Sur un onglet déjà ouvert sur YouTube, `chrome.tabs.sendMessage` livre le
   message ici. Si le popup a dû ouvrir un NOUVEL onglet YouTube, il dépose la
   section visée dans le storage à la place (rien à écouter avant que ce
   content script démarre) ; on la consomme une fois au montage du panneau. */
function openSection(sectionId){
  if(!lastPanelData || !SECTIONS.some(s=>s.id===sectionId)) return;
  switchSection(sectionId,lastPanelData,lastPanelScores,lastPanelChecklist);
  document.getElementById("echo-rank-panel")?.classList.remove("echo-panel-hidden");
  document.getElementById("echo-shorts-toggle")?.classList.add("echo-toggle-hidden");
}
chrome.runtime.onMessage.addListener((message)=>{
  if(message && message.type==="VIDSPARK_OPEN_SECTION") openSection(message.section);
});
function consumePendingSection(){
  try{
    chrome.storage.local.get("vs_pending_section", r=>{
      if(r && r.vs_pending_section){
        chrome.storage.local.remove("vs_pending_section");
        openSection(r.vs_pending_section);
      }
    });
  }catch(e){}
}

/* ══════════════════════════════════════════════════════════════
   BOOTSTRAP
══════════════════════════════════════════════════════════════ */

// Afficher le panneau d'activation si pas encore activée
/** Template seul (sans création de conteneur) — réutilisé par le panneau flottant autonome
 *  ET par le shell (qui l'affiche directement dans sa colonne principale). */
function renderActivationHTML(){
  const actLangOpts = LANG_LIST.map(l=>`<option value="${l.code}" ${l.code===currentLanguage?"selected":""}>${l.label}</option>`).join("");
  return `
    <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
      <select id="actLangSelect" class="echo-lang-select" style="font-size:11px;">${actLangOpts}</select>
    </div>
    <div style="margin-bottom:16px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px">⚡</div>
      <h2 style="color:#7c6dfa;margin:0 0 8px;font-size:16px;font-weight:800">VidSpark AI</h2>
      <p style="color:#aaa;margin:0;font-size:12px">${esc(T("act_subtitle"))}</p>
    </div>

    <!-- Connexion Google (chantier B) — voie principale, comme TubeBuddy "Continue with Google".
         Aucune saisie manuelle requise dans ce chemin. -->
    <button id="googleSignInBtn" type="button" style="width:100%;padding:12px;background:#fff;color:#1a1a1a;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px;">
      <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.86 2.7-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"/></svg>
      <span id="googleSignInLabel">${esc(ST('shell_connect'))}</span>
    </button>
    <p id="googleSignInStatus" style="font-size:11px;color:#f66;min-height:14px;margin-bottom:6px;"></p>

    <button id="toggleManualActivation" type="button" style="background:transparent;border:none;color:#8b8b98;font-size:11px;cursor:pointer;text-decoration:underline;margin-bottom:12px;">${esc(currentLanguage==='fr'?"Ou activer avec un code":"Or activate with a code")}</button>

    <div id="manualActivationBlock" style="display:none;">
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11px;color:#aaa;margin-bottom:4px;text-align:left;">${esc(T("act_id_label"))}</label>
        <input type="text" id="activationIdInput" placeholder="VID..." style="width:100%;padding:10px;border:1px solid #7c6dfa;border-radius:8px;background:#0f0f1a;color:#fff;font-size:12px;box-sizing:border-box;">
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11px;color:#aaa;margin-bottom:4px;text-align:left;">${esc(T("act_secret_label"))}</label>
        <div style="display:flex;gap:8px;">
          <input type="password" id="activationSecretInput" placeholder="${esc(T("act_secret_placeholder"))}" style="flex:1;padding:10px;border:1px solid #7c6dfa;border-radius:8px;background:#0f0f1a;color:#fff;font-size:12px;box-sizing:border-box;">
          <button id="toggleSecret" style="background:var(--b2,#2a2a35);color:#fff;padding:8px 12px;border:none;border-radius:8px;cursor:pointer;font-size:12px;">👁️</button>
        </div>
      </div>

      <button id="activateBtn" style="width:100%;padding:12px;background:#7c6dfa;color:white;border:none;border-radius:8px;font-weight:bold;font-size:13px;cursor:pointer;transition:all 0.2s;margin-bottom:8px;">✅ ${esc(T("act_btn_activate"))}</button>
      <p id="activationStatus" style="font-size:11px;color:#aaa;min-height:14px;margin-bottom:8px;"></p>
    </div>

    <button id="dashboardBtn" style="width:100%;padding:11px;background:transparent;color:#7c6dfa;border:1px solid #7c6dfa;border-radius:8px;font-weight:bold;font-size:12px;cursor:pointer;transition:all 0.2s;">📊 ${esc(T("act_btn_dashboard"))}</button>
  `;
}

/** Câble tous les événements du template ci-dessus sur N'IMPORTE QUEL conteneur (panneau
 *  flottant autonome OU colonne principale du shell). opts.onSuccess() est appelé au lieu
 *  d'une action de fermeture codée en dur — le conteneur choisit ce que "réussi" signifie. */
function wireActivationEvents(container, opts = {}){
  const onSuccess = opts.onSuccess || (() => {});

  const googleBtn = container.querySelector('#googleSignInBtn');
  const googleStatus = container.querySelector('#googleSignInStatus');
  googleBtn.addEventListener('click', () => {
    googleBtn.disabled = true;
    container.querySelector('#googleSignInLabel').textContent = currentLanguage==='fr' ? 'Connexion…' : 'Signing in…';
    googleStatus.textContent = '';
    chrome.runtime.sendMessage({ type: 'VIDSPARK_GOOGLE_SIGNIN' }, (resp) => {
      googleBtn.disabled = false;
      const label = container.querySelector('#googleSignInLabel');
      if(label) label.textContent = ST('shell_connect');
      if (chrome.runtime.lastError) { googleStatus.textContent = chrome.runtime.lastError.message; return; }
      if (!resp || !resp.success) {
        const code = resp?.error;
        googleStatus.textContent = code === 'CANCELLED'
          ? ''
          : (currentLanguage==='fr' ? 'Connexion Google impossible.' : 'Google sign-in failed.');
        return;
      }
      onSuccess();
    });
  });

  container.querySelector('#toggleManualActivation').addEventListener('click', () => {
    const block = container.querySelector('#manualActivationBlock');
    block.style.display = block.style.display === 'none' ? 'block' : 'none';
  });

  container.querySelector('#actLangSelect').addEventListener('change', function(){
    currentLanguage = this.value;
    chrome.storage.local.set({ echoLanguage: currentLanguage });
    container.innerHTML = renderActivationHTML();
    wireActivationEvents(container, opts); // réaffiche dans la même langue, mêmes callbacks
  });

  const idInput = container.querySelector('#activationIdInput');
  const secretInput = container.querySelector('#activationSecretInput');
  const toggleBtn = container.querySelector('#toggleSecret');
  const activateBtn = container.querySelector('#activateBtn');
  const statusEl = container.querySelector('#activationStatus');

  toggleBtn.addEventListener('click', () => {
    secretInput.type = secretInput.type === 'password' ? 'text' : 'password';
    toggleBtn.textContent = secretInput.type === 'password' ? '👁️' : '🙈';
  });

  const dashboardBtn = container.querySelector('#dashboardBtn');
  dashboardBtn.addEventListener('click', () => {
    window.open('https://vidsparkpro.com/dashboard', '_blank');
  });
  dashboardBtn.addEventListener('mouseover', () => { dashboardBtn.style.background = 'rgba(124, 109, 250, 0.1)'; });
  dashboardBtn.addEventListener('mouseout', () => { dashboardBtn.style.background = 'transparent'; });

  activateBtn.addEventListener('click', async () => {
    const id = idInput.value.trim();
    const secret = secretInput.value.trim();

    if (!id || !secret) {
      statusEl.textContent = '⚠️ ' + T('act_err_missing');
      statusEl.style.color = '#fa6d6d';
      return;
    }

    activateBtn.disabled = true;
    activateBtn.textContent = '⏳ ' + T('act_verifying');
    statusEl.textContent = '';

    try {
      const deviceId = await getDeviceId();
      const res = await fetch('https://vidspark-ai-production-9ac7.up.railway.app/api/activation/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activation_id: id, activation_secret: secret, device_id: deviceId })
      });

      const body = await res.json();

      if (!res.ok) {
        let errMsg;
        if (body.expired)                    errMsg = T('act_err_expired');
        else if (body.code === 'DEVICE_LOCKED') errMsg = T('act_err_device');
        else if (res.status === 401)         errMsg = T('act_err_invalid');
        else                                 errMsg = body.error || T('act_err_generic');
        statusEl.textContent = '❌ ' + errMsg;
        statusEl.style.color = '#fa6d6d';
        activateBtn.disabled = false;
        activateBtn.textContent = '✅ ' + T('act_btn_activate');
        return;
      }

      const expiryDate = new Date(body.subscription.expiry);
      const storageData = {
        activation_id: id,
        activation_secret: secret,
        subscription_expiry: expiryDate.toISOString(),
        userToken: body.user?.id || '',
        userEmail: body.user?.email || '',
        userPlan: body.user?.plan || 'free'
      };
      storageData.authorizedChannelIds = Array.isArray(body.channel_ids) ? body.channel_ids : [];
      chrome.storage.local.set(storageData, () => {
        statusEl.textContent = '✅ ' + T('act_success');
        statusEl.style.color = '#4ade80';
        setTimeout(() => {
          currentUserToken = body.user?.id;
          currentUserEmail = body.user?.email;
          currentPlan = body.user?.plan || 'free';
          panelMounted = false;
          panelCreating = false;
          onSuccess();
        }, 800);
      });
    } catch (e) {
      statusEl.textContent = '❌ ' + T('act_err_generic') + ': ' + e.message;
      statusEl.style.color = '#fa6d6d';
      activateBtn.disabled = false;
      activateBtn.textContent = '✅ ' + T('act_btn_activate');
    }
  });
}

/** Panneau flottant autonome — conservé pour compatibilité mais plus jamais déclenché
 *  automatiquement (voir bootFromStorage/createPanel) : la seule porte d'entrée normale
 *  est désormais le shell (bouton masthead), qui affiche ce même contenu dans sa colonne
 *  principale. Gardé pour un futur appel explicite si besoin, jamais en flottant imposé. */
function showActivationPanel() {
  if (document.getElementById('vidspark-activation')) return;
  const oldPanel = document.getElementById('echo-rank-panel');
  if (oldPanel) oldPanel.remove();

  const panel = document.createElement('div');
  panel.id = 'vidspark-activation';
  panel.style.cssText = 'position:fixed;top:64px;left:64px;width:360px;max-width:92vw;z-index:2147483000;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:2px solid #7c6dfa;border-radius:14px;padding:20px;box-sizing:border-box';
  panel.innerHTML = renderActivationHTML();
  document.body.appendChild(panel);
  wireActivationEvents(panel, {
    onSuccess: () => { panel.remove(); panelMounted = false; bootFromStorage(); }
  });
}

/* ══════════════════════════════════════════════════════════════
   SHELL — 2 boutons dans le masthead YouTube + 2 panneaux overlay
   (principe TubeBuddy). Entièrement ADDITIF : ne touche à AUCUNE
   fonction existante (createPanel/showActivationPanel inchangées),
   ne dépend jamais de #secondary (fonctionne donc aussi sur Shorts),
   et s'affiche que l'extension soit activée ou non.
══════════════════════════════════════════════════════════════ */

/** Injecte les 2 boutons dans la barre YouTube. Idempotent — sûr à rappeler
 *  à chaque tick de navigation (YouTube peut recréer le masthead en SPA). */
function injectToolbarButtons(){
  if(!extAlive())return;
  if(document.getElementById('vidspark-toolbar-wrap'))return; // déjà présent
  const container = document.querySelector('ytd-masthead #end #buttons');
  if(!container)return; // pas encore prêt — un prochain appel (bootFromStorage/_navIv) réessaiera

  const wrap = document.createElement('div');
  wrap.id = 'vidspark-toolbar-wrap';
  wrap.className = 'vidspark-tb-wrap';
  wrap.innerHTML = `
    <button id="vidspark-toolbar-btn" class="vidspark-tb-btn" type="button" title="${esc(ST('shell_title'))}" aria-label="${esc(ST('shell_title'))}" aria-expanded="false">
      <img src="${chrome.runtime.getURL('icon.png')}" alt="" class="vidspark-tb-icon">
    </button>
    <button id="vidspark-insights-btn" class="vidspark-tb-btn" type="button" title="${esc(ST('insights_title'))}" aria-label="${esc(ST('insights_title'))}">🏆</button>
  `;
  container.prepend(wrap);

  document.getElementById('vidspark-toolbar-btn').addEventListener('click', (e)=>{ e.stopPropagation(); toggleQuickMenu(); });
  document.getElementById('vidspark-insights-btn').addEventListener('click', (e)=>{
    e.stopPropagation();
    if(!currentUserToken || !currentUserEmail){ toggleShellPanel(); return; } // pas connecté → flux de connexion habituel
    openChannelInsights();
  });
}

function removeStatsCard(){
  document.getElementById('vidspark-stats-card')?.remove();
}

/** Fenêtre "Recherche concurrents" (façon Channel Insights de TubeBuddy) — ouverte par son
 *  propre bouton du masthead. Réutilise la même route backend réelle déjà en prod dans
 *  l'onglet Analyser (#btnRealComp → action "yt_competitors") : vraies vidéos YouTube qui
 *  performent sur un mot-clé, jamais de donnée inventée. */
function renderChannelInsightsHTML(){
  return `
    <div class="vs-ins-header">
      <span class="vs-ins-title">🏆 ${esc(ST('insights_title'))}</span>
      <span class="vs-ins-badge">● LIVE</span>
      <button class="vs-ins-close" id="vsInsightsClose" type="button" aria-label="${esc(ST('insights_close'))}">✕</button>
    </div>
    <div class="vs-ins-body">
      <div class="vs-ins-search-row">
        <input type="text" id="vsInsightsInput" class="vs-ins-input" placeholder="${esc(ST('insights_search_ph'))}">
        <button class="vs-ins-search-btn" id="vsInsightsSearch" type="button">${esc(ST('insights_search_btn'))}</button>
      </div>
      <div id="vsInsightsResults" class="vs-ins-results"></div>
    </div>
  `;
}

function openChannelInsights(){
  // Deuxième clic sur le bouton = ferme (comportement toggle standard), animé pareil.
  const existing = document.getElementById('vidspark-insights-modal');
  if(existing){
    if(!existing.dataset.closing){
      existing.dataset.closing = '1';
      existing.classList.add('vs-ins-closing');
      setTimeout(()=>existing.remove(), 140);
    }
    return;
  }

  const backdrop = document.createElement('div');
  backdrop.id = 'vidspark-insights-modal';
  backdrop.className = 'vs-ins-backdrop';
  backdrop.innerHTML = `<div class="vs-ins-card" role="dialog" aria-modal="true" aria-label="${esc(ST('insights_title'))}">${renderChannelInsightsHTML()}</div>`;
  document.body.appendChild(backdrop);

  const close = ()=>{
    if(backdrop.dataset.closing) return;
    backdrop.dataset.closing = '1';
    backdrop.classList.add('vs-ins-closing');
    document.removeEventListener('keydown', onEsc);
    setTimeout(()=>backdrop.remove(), 140);
  };
  const onEsc = (e)=>{ if(e.key==='Escape') close(); };
  document.addEventListener('keydown', onEsc);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close(); });
  backdrop.querySelector('#vsInsightsClose').addEventListener('click', close);

  const input = backdrop.querySelector('#vsInsightsInput');
  const runSearch = async ()=>{
    const q = input.value.trim();
    if(!q) return;
    const results = backdrop.querySelector('#vsInsightsResults');
    results.innerHTML = spinnerHTML('📡 …');
    try{
      const r = await sendBG({action:'yt_competitors', query:q});
      const rows = (r.videos||[]).slice(0,10).map(v=>{
        const href = v.videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(v.videoId)}` : null;
        const tag = href ? 'a' : 'div';
        const hrefAttr = href ? `href="${esc(href)}" target="_blank" rel="noopener"` : '';
        return `
        <${tag} class="vs-ins-row" ${hrefAttr}>
          <div class="vs-ins-row-main">
            <div class="vs-ins-row-title">${esc(v.title)}</div>
            <div class="vs-ins-row-channel">${esc(v.channel)}</div>
          </div>
          <div class="vs-ins-row-stats">
            <b>${fmtNum(v.views_per_hour)}${esc(ST('insights_per_hour'))}</b>
            <span>${fmtNum(v.views)} ${esc(ST('insights_views'))}</span>
          </div>
        </${tag}>`;
      }).join('');
      results.innerHTML = rows || `<div class="vs-ins-empty">${esc(ST('insights_empty'))}</div>`;
    }catch(e){ results.innerHTML = errHTML(e.message); }
  };
  backdrop.querySelector('#vsInsightsSearch').addEventListener('click', runSearch);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') runSearch(); });

  // Pré-remplissage avec le titre de la vidéo en cours, comme le fait déjà #btnRealComp.
  // Priorité à la page réelle (getVideoData) : lastPanelData peut encore pointer sur
  // l'ancienne vidéo tant que createPanel() n'a pas fini de se reconstruire pour la nouvelle.
  const data = getVideoData() || lastPanelData;
  if(data?.title){
    input.value = data.title.split(/[|\-–—:•]/)[0].trim().split(/\s+/).slice(0,6).join(" ");
    runSearch();
  }
  input.focus();
}

/** Petit tableau fixe (façon Videolytics de TubeBuddy), épinglé en haut de la colonne
 *  latérale YouTube — vues/commentaires/j'aime lus en direct sur la page, scores déjà
 *  calculés par le panneau principal (mêmes chiffres partout, pas de double calcul),
 *  tags lus dans les meta tags réels. Valeur illisible → "—", jamais devinée. */
function injectStatsCard(data, scores, _retried){
  const host = document.querySelector('#secondary-inner');
  if(!host){
    // Pas encore prêt (rendu SPA en retard) — un seul nouvel essai, sinon on abandonne
    // proprement (mise en page compacte où #secondary-inner n'existe pas).
    if(!_retried) setTimeout(()=>injectStatsCard(data,scores,true), 800);
    return;
  }
  let card = document.getElementById('vidspark-stats-card');
  // déjà à jour pour cette vidéo ET cette langue (un changement de langue doit forcer le rebuild)
  if(card && card.dataset.videoId === data.videoId && card.dataset.lang === currentLanguage) return;
  if(card) card.remove();

  const likes = readLikeCount();
  const comments = readCommentCount();
  const subs = readSubscriberCount();
  const tags = readVideoTags();
  const na = ST('stats_na');
  const isPaid = !!currentPlan && currentPlan !== 'free';
  const langOpts = LANG_LIST.map(l=>
    `<option value="${l.code}" ${l.code===currentLanguage?"selected":""}>${l.label}</option>`
  ).join("");

  // Scores + Chaîne + Croissance : données à valeur ajoutée VidSpark, réservées aux
  // forfaits payants (comme le reste de l'extension) — le compte Free ne voit que le
  // résumé public (vues/commentaires/j'aime, déjà affichés par YouTube lui-même).
  const premiumHTML = `
    <div class="vs-stats-section-lbl">${esc(ST('stats_scores'))}</div>
    <div class="vs-stats-scores">
      <div class="vs-stats-score">
        <span class="vs-stats-score-num" style="color:${scoreColor(scores.seo)}">${scores.seo}</span>
        <span class="vs-stats-lbl">${esc(ST('stats_seo'))}</span>
      </div>
      <div class="vs-stats-score">
        <span class="vs-stats-score-num" style="color:${scoreColor(scores.viral)}">${scores.viral}</span>
        <span class="vs-stats-lbl">${esc(ST('stats_viral'))}</span>
      </div>
      <div class="vs-stats-score">
        <span class="vs-stats-score-num" style="color:${scoreColor(scores.global)}">${scores.global}</span>
        <span class="vs-stats-lbl">${esc(ST('stats_global'))}</span>
      </div>
    </div>

    <div class="vs-stats-section-lbl">${esc(ST('stats_channel'))}</div>
    <div class="vs-stats-summary">
      <div class="vs-stats-metric"><span class="vs-stats-num" id="vsStatsChanViews">${esc(na)}</span><span class="vs-stats-lbl">${esc(ST('stats_total_views'))}</span></div>
      <div class="vs-stats-metric"><span class="vs-stats-num" id="vsStatsChanSubs">${esc(subs||na)}</span><span class="vs-stats-lbl">${esc(ST('stats_subscribers'))}</span></div>
      <div class="vs-stats-metric"><span class="vs-stats-num" id="vsStatsChanVideos">${esc(na)}</span><span class="vs-stats-lbl">${esc(ST('stats_videos'))}</span></div>
    </div>

    <div class="vs-stats-section-lbl">📈 ${esc(ST('stats_growth'))}</div>
    <div id="vsStatsGrowth" class="vs-stats-growth">${esc(na)}</div>
  `;

  card = document.createElement('div');
  card.id = 'vidspark-stats-card';
  card.className = 'vidspark-stats-card';
  card.dataset.videoId = data.videoId;
  card.dataset.lang = currentLanguage;
  card.innerHTML = `
    <div class="vs-stats-head">
      <span class="vs-stats-logo">⚡</span>
      <span class="vs-stats-title">VidSpark AI</span>
      <select class="vs-stats-lang-select" id="vsStatsLangSelect" aria-label="${esc(T("lang_changed"))}">${langOpts}</select>
    </div>

    <div class="vs-stats-section-lbl">${esc(ST('stats_summary'))}</div>
    <div class="vs-stats-summary">
      <div class="vs-stats-metric"><span class="vs-stats-num">${esc(data.views||na)}</span><span class="vs-stats-lbl">${esc(ST('stats_views'))}</span></div>
      <div class="vs-stats-metric"><span class="vs-stats-num" id="vsStatsComments">${esc(comments||na)}</span><span class="vs-stats-lbl">${esc(ST('stats_comments'))}</span></div>
      <div class="vs-stats-metric"><span class="vs-stats-num" id="vsStatsLikes">${esc(likes||na)}</span><span class="vs-stats-lbl">${esc(ST('stats_likes'))}</span></div>
    </div>

    ${isPaid ? premiumHTML : lockedFeature(premiumHTML, ST('stats_locked_title'))}

    ${tags.length ? `
    <div class="vs-stats-section-lbl">${esc(ST('stats_tags'))}</div>
    <div class="vs-stats-tags">${tags.slice(0,12).map(t=>`<span class="vs-stats-tag">${esc(t)}</span>`).join('')}</div>
    ` : ''}
  `;
  host.prepend(card);

  card.querySelector('#vsStatsLangSelect').addEventListener('change', function(){
    currentLanguage = this.value;
    chrome.storage.local.set({ echoLanguage: currentLanguage });
    panelMounted = false; currentVideoId = null;
    createPanel();
    showToast(T("lang_changed")+" : "+LANG_LIST.find(l=>l.code===currentLanguage)?.label);
  });
  card.querySelectorAll('.echo-locked-btn').forEach(b=>{
    b.addEventListener('click', ()=>window.open('https://vidsparkpro.com/billing','_blank'));
  });

  if(!isPaid) return; // le reste (données réelles chaîne + historique) est réservé aux forfaits payants

  // Vues/j'aime/commentaires/chaîne réels via l'API YouTube (même route déjà en prod que
  // le Coach), jamais de scraping approximatif pour un compte payant. Chargé après coup,
  // jamais bloquant pour le premier rendu.
  sendBG({action:'yt_video', videoId:data.videoId}).then(v=>{
    if(!v || !document.body.contains(card)) return;
    const set=(id,val)=>{ const el=card.querySelector('#'+id); if(el && val!=null) el.textContent = fmtNum(val); };
    set('vsStatsComments', v.comments);
    set('vsStatsLikes', v.likes);
    set('vsStatsChanViews', v.channel_views);
    set('vsStatsChanSubs', v.channel_subs);
    set('vsStatsChanVideos', v.channel_videos);

    const channelId = v.channel_id || extractYouTubeChannelId();
    if(!channelId) return;
    sendBG({action:'growth_history', channelId}).then(r=>{
      const el = card.querySelector('#vsStatsGrowth');
      if(!el || !document.body.contains(card)) return;
      const points = r?.points || [];
      if(points.length < 2){ el.textContent = ST('stats_growth_start'); return; }
      const first = points[0], last = points[points.length-1];
      const days = Math.max(1, Math.round((new Date(last.captured_on) - new Date(first.captured_on)) / 864e5));
      const dSubs = last.subscribers - first.subscribers;
      const sign = dSubs > 0 ? '+' : '';
      el.innerHTML = `<b style="color:${dSubs>=0?'#22c55e':'#ef4444'}">${sign}${fmtNum(dSubs)}</b> ${esc(ST('stats_subscribers').toLowerCase())} · ${esc(ST('stats_growth_days').replace('{n}', days))}`;
    }).catch(()=>{});
  }).catch(()=>{
    // Route payante : un échec (403, réseau) laisse simplement les "—" déjà affichés.
  });
}

/** UNE SEULE fenêtre au total : le panneau réel (#echo-rank-panel) est déjà une app complète
 *  (en-tête, plan, menu compte, onglets de sections, contenu) — pas de structure parallèle.
 *  Ferme aussi le panneau de connexion s'il est ouvert. */
function closeShellPanels(){
  closeQuickMenu();
  const real = document.getElementById('echo-rank-panel');
  const act  = document.getElementById('vidspark-activation');
  const wasVisible = (real && !real.classList.contains('echo-panel-hidden')) || (act && act.style.display !== 'none');
  if(real){
    real.classList.add('echo-panel-hidden');
    document.getElementById('echo-shorts-toggle')?.classList.remove('echo-toggle-hidden');
  }
  if(act) act.style.display = 'none';
  document.getElementById('vidspark-toolbar-btn')?.setAttribute('aria-expanded','false');
  if(wasVisible) document.getElementById('vidspark-toolbar-btn')?.focus();
}

/** Quick Menu du bouton ⚡ : centre de contrôle rapide (façon TubeBuddy), ancré sous le
 *  bouton. ZÉRO appel réseau — relit uniquement lastPanelData/lastPanelScores déjà en
 *  mémoire (posés par createPanel()) et les mêmes listes/dictionnaires que le panneau
 *  complet (SECTIONS, ST, T). Ne remplace pas #echo-rank-panel : "→ Ouvrir VidSpark" et
 *  chaque section l'ouvrent tel quel (voir openVidSparkSection). */
function renderQuickMenuHTML(){
  const pageType = getPageType();
  const isVideoCtx = pageType === 'VIDEO' || pageType === 'SHORT';
  const hasData = isVideoCtx && !!(lastPanelData && lastPanelScores);
  const scores = lastPanelScores || {};
  const planBadge = currentPlan ? `<span class="echo-plan-badge ${currentPlan}">${esc(T("plan_"+currentPlan))}</span>` : '';
  const scoresHTML = hasData ? `
    <div class="vs-qm-scores">
      <div class="vs-qm-score"><b style="color:${scoreColor(scores.seo)}">${scores.seo}</b><span>${esc(ST('stats_seo'))}</span></div>
      <div class="vs-qm-score"><b style="color:${scoreColor(scores.viral)}">${scores.viral}</b><span>${esc(ST('stats_viral'))}</span></div>
      <div class="vs-qm-score"><b style="color:${scoreColor(scores.global)}">${scores.global}</b><span>${esc(ST('stats_global'))}</span></div>
    </div>` : '';
  // Le panneau complet ne se monte qu'sur une page vidéo (architecture actuelle, inchangée
  // ici) — sur une page chaîne/recherche, on le dit clairement plutôt que de laisser croire
  // que les sections vont s'ouvrir avec un contenu propre à cette page (aucune donnée de ce
  // type n'existe aujourd'hui, on n'en invente pas).
  const hintHTML = !isVideoCtx
    ? `<div class="vs-qm-hint">${esc(ST('qm_need_video'))}</div>`
    : '';
  const openLabel = currentUserToken ? ST('qm_open') : ST('qm_signin');
  return `
    <div class="vs-qm-head">
      <span class="vs-qm-logo">⚡</span>
      <span class="vs-qm-title">VidSpark AI</span>
      ${planBadge}
    </div>
    ${scoresHTML}
    ${hintHTML}
    <div class="vs-qm-sep"></div>
    <div class="vs-qm-sections" role="none">
      ${SECTIONS.map(s=>`<button class="vs-qm-item" role="menuitem" type="button" data-qm-section="${s.id}">${s.icon} ${esc(T(s.key))}</button>`).join('')}
    </div>
    <div class="vs-qm-sep"></div>
    <button class="vs-qm-open" id="vsQmOpen" type="button">→ ${esc(openLabel)}</button>
  `;
}

/** Ferme avec une courte animation (voir .vs-qm-closing) — jamais de suppression brutale.
 *  Idempotent : appeler sur un menu déjà en train de se fermer, ou absent, ne fait rien. */
function closeQuickMenu(){
  const menu = document.getElementById('vidspark-quickmenu');
  if(!menu || menu.dataset.closing) return;
  menu.dataset.closing = '1';
  document.getElementById('vidspark-toolbar-btn')?.setAttribute('aria-expanded','false');
  menu.classList.add('vs-qm-closing');
  setTimeout(()=>menu.remove(), 110);
}

function openQuickMenu(){
  const wrap = document.getElementById('vidspark-toolbar-wrap');
  if(!wrap) return;
  closeQuickMenu(); // jamais deux instances
  const rect = wrap.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.id = 'vidspark-quickmenu';
  menu.className = 'vs-qm';
  menu.setAttribute('role','menu');
  menu.setAttribute('aria-label', 'VidSpark AI');
  // Position provisoire (ancré sous le bouton, aligné à droite) — corrigée juste après
  // avec les dimensions réelles pour ne jamais sortir de l'écran (petites fenêtres, Shorts).
  menu.style.top = (rect.bottom + 8) + 'px';
  menu.style.right = Math.max(8, window.innerWidth - rect.right) + 'px';
  menu.innerHTML = renderQuickMenuHTML();
  document.body.appendChild(menu);

  const mRect = menu.getBoundingClientRect();
  if(mRect.bottom > window.innerHeight - 8){
    // Pas assez de place en dessous → au-dessus du bouton à la place.
    menu.style.top = 'auto';
    menu.style.bottom = Math.max(8, window.innerHeight - rect.top + 8) + 'px';
  }
  if(mRect.left < 8){
    menu.style.right = 'auto';
    menu.style.left = '8px';
  }

  menu.querySelectorAll('[data-qm-section]').forEach(b=>{
    b.addEventListener('click', ()=>openVidSparkSection(b.dataset.qmSection));
  });
  menu.querySelector('#vsQmOpen')?.addEventListener('click', ()=>openVidSparkSection(null));
  document.getElementById('vidspark-toolbar-btn')?.setAttribute('aria-expanded','true');
}

/** Toggle du Quick Menu — un seul point d'entrée pour ouvrir/fermer, jamais deux
 *  écouteurs empilés (le bouton du masthead appelle uniquement celle-ci). */
function toggleQuickMenu(){
  if(document.getElementById('vidspark-quickmenu')) closeQuickMenu();
  else openQuickMenu();
}

/** Ouvre le panneau complet EXISTANT (jamais une deuxième interface), optionnellement
 *  sur une section précise. Si pas encore activé/monté ET qu'on est sur une page vidéo,
 *  retombe sur le flux de connexion habituel. Si on est connecté mais hors d'une page
 *  vidéo (chaîne/recherche — le panneau ne s'y monte pas dans l'architecture actuelle),
 *  on le dit clairement au lieu de renvoyer à tort vers l'écran de connexion. */
function openVidSparkSection(sid){
  closeQuickMenu();
  const real = document.getElementById('echo-rank-panel');
  if(!real){
    if(currentUserToken && currentUserEmail && !isVideoPage()){
      showToast(ST('qm_need_video'));
      return;
    }
    toggleShellPanel();
    return;
  }
  if(real.classList.contains('echo-panel-hidden')) toggleShellPanel();
  if(sid && lastPanelData && lastPanelScores) switchSection(sid, lastPanelData, lastPanelScores, lastPanelChecklist);
}

/** Bouton principal du masthead : affiche/masque la fenêtre existante — même mécanisme que
 *  #echoPanelHide / #echo-shorts-toggle (voir enablePanelChrome/addShortsToggle). Si l'extension
 *  n'est pas encore activée (#echo-rank-panel n'existe pas), affiche le formulaire de connexion
 *  (Google ou code) dans une fenêtre flottante légère — jamais de structure supplémentaire. */
function toggleShellPanel(){
  const real = document.getElementById('echo-rank-panel');
  if(real){
    const willShow = real.classList.contains('echo-panel-hidden');
    const act = document.getElementById('vidspark-activation');
    if(act) act.style.display = 'none';
    const shortsToggle = document.getElementById('echo-shorts-toggle');
    if(willShow){
      real.classList.remove('echo-panel-hidden');
      shortsToggle?.classList.add('echo-toggle-hidden');
    }else{
      real.classList.add('echo-panel-hidden');
      shortsToggle?.classList.remove('echo-toggle-hidden');
    }
    document.getElementById('vidspark-toolbar-btn')?.setAttribute('aria-expanded', String(willShow));
    if(willShow) real.querySelector('.echo-header')?.scrollIntoView?.({block:'nearest'});
    return;
  }

  // Pas encore de panneau réel (non activé, ou pas encore monté pour cette vidéo) →
  // formulaire de connexion, seule fenêtre alternative possible.
  let panel = document.getElementById('vidspark-activation');
  if(panel){
    const willShow = panel.style.display === 'none';
    panel.style.display = willShow ? '' : 'none';
    document.getElementById('vidspark-toolbar-btn')?.setAttribute('aria-expanded', String(willShow));
    if(willShow) setTimeout(()=>panel.querySelector('button')?.focus(), 50);
    return;
  }

  panel = document.createElement('div');
  panel.id = 'vidspark-activation';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.style.cssText = 'position:fixed;top:64px;right:24px;width:360px;max-width:92vw;z-index:2147483000;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:2px solid #7c6dfa;border-radius:14px;padding:20px;box-sizing:border-box;box-shadow:0 24px 60px -12px rgba(0,0,0,.6),0 4px 18px rgba(0,0,0,.35);';
  panel.innerHTML = renderActivationHTML();
  document.body.appendChild(panel);
  wireActivationEvents(panel, {
    onSuccess: () => { panel.style.display = 'none'; panelMounted = false; bootFromStorage(); }
  });
  document.getElementById('vidspark-toolbar-btn')?.setAttribute('aria-expanded', 'true');
  setTimeout(()=>panel.querySelector('button')?.focus(), 50);
}

// Fermeture au clic extérieur / Échap — une seule fois, jamais dupliquée.
if(!window.__vidsparkShellGlobalListeners){
  window.__vidsparkShellGlobalListeners = true;
  document.addEventListener('click', (e)=>{
    const real = document.getElementById('echo-rank-panel');
    const act  = document.getElementById('vidspark-activation');
    const wrap = document.getElementById('vidspark-toolbar-wrap');
    const qm   = document.getElementById('vidspark-quickmenu');
    if(qm && !qm.contains(e.target) && !(wrap && wrap.contains(e.target))) closeQuickMenu();
    if(wrap && wrap.contains(e.target))return;
    if(real && real.contains(e.target))return;
    if(act && act.contains(e.target))return;
    // Ne ferme pas sur un clic extérieur : le panneau réel a son propre drag/resize et son
    // propre bouton de fermeture (echoPanelHide) — le fermer au clic extérieur romprait ces
    // interactions (ex: cliquer sur la vidéo pendant qu'on lit le panneau).
  });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeShellPanels(); });
}

/* Le démarrage est une fonction nommée, et non plus un appel unique : il doit
   pouvoir être rejoué à l'identique quand les identifiants d'activation
   arrivent après coup (connexion sur le site). Rejouer le bloc entier — et pas
   seulement createPanel() — garantit que le verrou d'appareil, la resynchro du
   plan et l'observateur de navigation sont installés dans tous les cas. */
let activationSyncTried = false;   // une seule tentative : pas de boucle si le serveur répond sans identifiants
let _navIv = null;                 // un seul observateur, même après un rejeu

function bootFromStorage(){
chrome.storage.local.get(["activation_id","activation_secret","subscription_expiry","echoLanguage","userPlan","userEmail","userAvatar","userName","userToken","authorizedChannelIds"],result=>{
  // Langue choisie manuellement (ex. sur le panneau d'activation) : prioritaire sur la détection navigateur.
  if(result.echoLanguage) currentLanguage = result.echoLanguage;

  // Shell (boutons + panneaux) : AVANT toute vérification d'activation — doit être
  // accessible immédiatement, avec ou sans compte (principe TubeBuddy demandé).
  injectToolbarButtons();

  // Vérifier l'activation
  if(!result.activation_id || !result.subscription_expiry){
    /* Compte déjà connecté mais identifiants absents : les demander au serveur
       avant de réclamer une saisie manuelle. Cas courant — l'utilisateur s'est
       connecté sur le site depuis un autre onglet, ou a lié sa chaîne après
       coup. Le backend ne les délivre que si une chaîne YouTube est liée. */
    if(result.userToken && !activationSyncTried){
      activationSyncTried = true;
      console.log('[VidSpark] Pas d\'identifiants locaux — tentative de synchro depuis le compte.');
      chrome.runtime.sendMessage({ type: 'VIDSPARK_SYNC_ACTIVATION' }, resp => {
        if(!chrome.runtime.lastError && resp && resp.success){
          bootFromStorage();          // identifiants en place : démarrage complet
        }
        // Sinon : rien à afficher automatiquement — le bouton du masthead (déjà injecté
        // plus haut) reste la seule porte d'entrée vers la connexion.
      });
      return;
    }
    console.log('[VidSpark] Extension non activée. Bouton VidSpark disponible pour se connecter.');
    return; // Ne rien charger si pas activée — pas de panneau flottant imposé
  }

  // Vérifier l'expiration du forfait
  const expiryDate = new Date(result.subscription_expiry);
  if(expiryDate < new Date()){
    console.log('[VidSpark] Forfait expiré.');
    return;
  }

  // ✅ Activation valide — charger l'extension
  console.log('[VidSpark] Extension activée, forfait valide jusqu\'à:', expiryDate.toLocaleDateString());

  if(result.echoLanguage)currentLanguage=result.echoLanguage;
  if(result.userPlan)currentPlan=result.userPlan;
  if(result.userEmail)currentUserEmail=result.userEmail;
  if(result.userAvatar)currentUserAvatar=result.userAvatar;
  if(result.userName)currentUserName=result.userName;
  if(result.userToken){
    currentUserToken = result.userToken;
    console.log('[VidSpark] User auto-loaded from storage:', { email: result.userEmail, plan: result.userPlan });
  }

  // 🔒 Resync serveur : récupérer la chaîne verrouillée (incontournable même si le cache est vidé)
  (async () => {
    try {
      if (result.activation_id && result.activation_secret) {
        const deviceId = await getDeviceId();
        const r = await fetch('https://vidspark-ai-production-9ac7.up.railway.app/api/activation/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activation_id: result.activation_id, activation_secret: result.activation_secret, device_id: deviceId })
        });
        // 🔒 Code lié à un autre appareil → déconnexion de ce PC
        if (r.status === 403) {
          const eb = await r.json().catch(()=>({}));
          if (eb.code === 'DEVICE_LOCKED') {
            chrome.storage.local.remove(['activation_id','activation_secret','subscription_expiry','userToken','userEmail','userPlan','authorizedChannelIds'],()=>{
              showToast('🔒 '+(eb.error||'Code utilisé sur un autre appareil'));
              panelMounted=false; createPanel();
            });
            return;
          }
        }
        if (r.ok) {
          const b = await r.json();
          // Synchroniser le PLAN réel (corrige un badge périmé après un upgrade)
          if (b.user?.plan) {
            currentPlan = b.user.plan;
            await chrome.storage.local.set({ userPlan: b.user.plan });
            console.log('[VidSpark] Plan resynchronisé:', b.user.plan);
          }
          // Synchroniser la liste complète des chaînes autorisées (multi-chaînes)
          if (Array.isArray(b.channel_ids)) {
            await chrome.storage.local.set({ authorizedChannelIds: b.channel_ids });
          }
        }
      }
    } catch (e) { console.warn('[VidSpark] Resync chaîne échoué:', e.message); }
    createPanel();
  })();
  // Observer pour les changements de vidéo/URL. YouTube émet 'yt-navigate-finish' à chaque
  // navigation SPA — on la détecte instantanément via cet événement, et le setInterval
  // (fréquence réduite : simple filet de sécurité, pas la voie principale) couvre les cas
  // où l'événement ne se déclenche pas (rechargement dur, chargement initial très lent).
  if(_navIv) clearInterval(_navIv);   // un rejeu de bootFromStorage ne doit pas empiler les observateurs
  checkNavChange(); // état initial, sans attendre le premier tick/événement
  if(!window.__vidsparkNavListener){  // un rejeu de bootFromStorage ne doit pas empiler les écouteurs
    window.__vidsparkNavListener = true;
    document.addEventListener('yt-navigate-finish', checkNavChange);
  }
  _navIv=setInterval(()=>{
    if(!extAlive()){ clearInterval(_navIv); return; }  // extension rechargée → on s'arrête proprement
    checkNavChange();
  },3000);  // filet de sécurité peu fréquent — la détection principale est l'événement ci-dessus
});
}

/* Logique de détection de changement de page — appelée par l'événement natif
   'yt-navigate-finish' (voie principale) et par le setInterval de secours (voir bootFromStorage).
   Jamais dupliquée entre les deux : une seule implémentation. */
function checkNavChange(){
  if(!extAlive()){ if(_navIv) clearInterval(_navIv); return; }
  injectToolbarButtons(); // idempotent — réinjecte si YouTube a recréé le masthead
  const cur=location.href;
  const vid=extractVideoId();
  if(cur!==lastUrl||(vid&&vid!==currentVideoId)){
    lastUrl=cur;panelMounted=false;currentVideoId=null;
    closeShellPanels(); // navigation = on referme les panneaux shell (comportement TubeBuddy)
    setTimeout(createPanel,500);  // UN SEUL appel
  }
}

bootFromStorage();

/* ══════════════════════════════════════════════════════════════
   ÉCOUTER LES CHANGEMENTS DE STORAGE (mises à jour auth)
══════════════════════════════════════════════════════════════ */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if(areaName !== 'local')return;

  /* Les identifiants d'activation viennent d'arriver (connexion sur le site, que
     background.js synchronise depuis /user/me). Sans ce cas, le panneau de saisie
     manuelle restait affiché jusqu'à un rechargement de la page : l'utilisateur
     voyait un formulaire lui réclamant un code déjà obtenu. */
  if(changes.activation_id && changes.activation_id.newValue){
    const actPanel = document.getElementById('vidspark-activation');
    if(actPanel || !panelMounted){
      console.log('[VidSpark] Identifiants reçus du compte, activation automatique.');
      if(actPanel) actPanel.remove();
      panelMounted = false;
      bootFromStorage();   // démarrage complet (verrou d'appareil + observateur), pas juste le panneau
      return;
    }
  }

  // Si le plan, l'email ou l'avatar change, recharger le panel
  if(changes.userPlan || changes.userEmail || changes.userToken || changes.userAvatar || changes.userName){
    console.log('[VidSpark] Storage changed, reloading panel...');
    if(changes.userToken)currentUserToken = changes.userToken.newValue;
    if(changes.userEmail)currentUserEmail = changes.userEmail.newValue;
    if(changes.userAvatar)currentUserAvatar = changes.userAvatar.newValue;
    if(changes.userName)currentUserName = changes.userName.newValue;
    if(changes.userPlan)currentPlan = changes.userPlan.newValue;
    panelMounted = false;
    setTimeout(() => createPanel(), 500);
  }
});

/* ══════════════════════════════════════════════════════════════
   AUTHENTIFICATION — Écouter les messages du site
══════════════════════════════════════════════════════════════ */
window.addEventListener('message', async (event) => {
  if(event.source !== window)return;
  if(event.data.type === 'VIDSPARK_AUTH'){
    const { email, token, plan, avatar, name } = event.data;
    console.log('[VidSpark] Auth received from site:', { email, plan, name });

    // Stocker le token, plan, email, avatar, et name
    await chrome.storage.local.set({
      userToken: token,
      userPlan: plan || 'free',
      userEmail: email,
      userAvatar: avatar || '',
      userName: name || email,
      authTimestamp: Date.now()
    });

    // Mettre à jour les variables locales
    currentPlan = plan || 'free';
    currentUserToken = token;
    currentUserEmail = email;
    currentUserAvatar = avatar || '';
    currentUserName = name || email;

    // ✅ ENVOYER UN ACK AU SITE POUR CONFIRMER
    window.postMessage({
      type: 'VIDSPARK_AUTH_ACK',
      success: true,
      plan: plan,
      email: email,
      timestamp: Date.now()
    }, '*');

    console.log('[VidSpark] Auth stored and ACK sent');

    // Recharger le panel
    panelMounted = false;
    setTimeout(() => createPanel(), 500);
  }
});
