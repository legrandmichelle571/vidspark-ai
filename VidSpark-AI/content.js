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

const I18N = {
  fr:{
    /* navigation */
    nav_overview:"Aperçu", nav_seo:"SEO", nav_thumbnail:"Miniature",
    nav_viral:"Viral", nav_competitor:"Concurrence", nav_titles:"Titres IA", nav_actions:"Actions",
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
    nav_overview:"Overview", nav_seo:"SEO", nav_thumbnail:"Thumbnail",
    nav_viral:"Viral", nav_competitor:"Competitors", nav_titles:"AI Titles", nav_actions:"Actions",
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

/* Traduction courante */
let currentLanguage = "fr";
function T(key) {
  const L = I18N[currentLanguage] || I18N.en;
  const v = L[key] !== undefined ? L[key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
  return v;
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
let lastUrl         = location.href;
let activeTab       = "overview";

/* ══════════════════════════════════════════════════════════════
   UTILITAIRES
══════════════════════════════════════════════════════════════ */
function esc(s){ if(!s)return""; return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function showToast(msg){
  let el=document.getElementById("echo-toast");
  if(!el){el=document.createElement("div");el.id="echo-toast";document.body.appendChild(el);}
  el.textContent=msg;el.classList.add("visible");
  setTimeout(()=>el.classList.remove("visible"),2200);
}

function scoreColor(n){ return n>=80?"#22c55e":n>=60?"#eab308":"#ef4444"; }

function spinnerHTML(msg){
  return `<div class="echo-loading"><div class="echo-spinner"></div><span>${msg||T("loading")}</span></div>`;
}

function errHTML(msg){ return `<div class="echo-error">⚠ ${esc(msg)}</div>`; }

function setContent(id, html){
  const el=document.getElementById(id);
  if(el) el.innerHTML=html;
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

function computeThumbScore(videoId){
  /* Déterministe par videoId — cohérent entre les rechargements */
  let hash=0;
  for(let i=0;i<(videoId||"").length;i++)hash=(hash*31+videoId.charCodeAt(i))&0xffffffff;
  return 50+Math.abs(hash%40);
}

function computeThumbPotential(thumbScore){
  return Math.min(100,thumbScore+Math.floor(Math.random()*15)+10);
}

function computeGlobalScore(seo,viral,thumb){
  return Math.round(seo*0.4+viral*0.35+thumb*0.25);
}

function computeCTR(seo,viral,thumb){
  /* CTR estimé en % basé sur les scores */
  const base=2.0;
  const bonus=(seo/100)*3+(viral/100)*2.5+(thumb/100)*2;
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
    {status:lenOk?"ok":"fix",
     label:L.cl_len_label,
     detail:lenOk?L.cl_len_ok(n):(n<45?L.cl_len_short(n):L.cl_len_long(n)),
     impact:lenOk?L.cl_len_impact_ok:L.cl_len_impact_fix(n),
     why:T("cl_len_why"),
     gain:lenOk?null:"+12 points SEO",
     example:lenOk?null:(n<45?`"${title} — Guide complet 2024"`:`"${title.slice(0,55)}…"`),
     suggestions:!lenOk&&n<45?[T("cl_len_s1"),T("cl_len_s2"),T("cl_len_s3")]:
                 !lenOk&&n>75?[T("cl_len_r1"),T("cl_len_r2"),T("cl_len_r3")]:[],
     weight:20},
    {status:hasNum?"ok":"fix",
     label:L.cl_num_label,
     detail:hasNum?L.cl_num_ok:L.cl_num_fix,
     impact:hasNum?T("impact_pos_num"):T("impact_neg_num"),
     why:T("cl_num_why"),
     gain:hasNum?null:"+8 points Viral",
     example:!hasNum?`"5 ${title.split(' ').slice(0,4).join(' ')}…"`:null,
     suggestions:!hasNum?[T("cl_num_s1"),T("cl_num_s2"),T("cl_num_s3")]:[],
     weight:15},
    {status:hasEm?"ok":"fix",
     label:L.cl_em_label,
     detail:hasEm?L.cl_em_ok:L.cl_em_fix,
     impact:hasEm?"Bon potentiel émotionnel":"Les mots forts augmentent le CTR de 20%",
     why:T("cl_em_why2"),
     gain:hasEm?null:"+12 points Viral",
     example:!hasEm?`"Incroyable : ${title.slice(0,40)}…"`:null,
     suggestions:!hasEm?[T("cl_em_s1"),T("cl_em_s2"),T("cl_em_s3"),T("cl_em_s4")]:[],
     weight:15},
    {status:hasHk?"ok":"fix",
     label:L.cl_hk_label,
     detail:hasHk?L.cl_hk_ok:L.cl_hk_fix,
     impact:hasHk?"Hook CTR efficace détecté":"Un hook en début de titre augmente les clics de 25%",
     why:T("cl_hk_why2"),
     gain:hasHk?null:"+18 points Viral",
     example:!hasHk?`"Comment ${title.slice(0,45)}…"`:null,
     suggestions:!hasHk?[T("cl_hk_s1"),T("cl_hk_s2"),T("cl_hk_s3")]:[],
     weight:25},
    {status:descOk?"ok":"fix",
     label:L.cl_desc_label,
     detail:descOk?L.cl_desc_ok(d):L.cl_desc_fix(d),
     impact:descOk?"Description bien optimisée":"Description courte réduit le référencement",
     why:T("cl_desc_why"),
     gain:descOk?null:"+10 points SEO",
     example:!descOk?"Ajouter : résumé (150 car.) + timestamps + mots-clés + CTA + liens":null,
     suggestions:!descOk?[T("cl_desc_s1"),T("cl_desc_s2"),T("cl_desc_s3")]:[],
     weight:25},
    {status:hasPunct?"ok":"fix",
     label:"Ponctuation CTR (? ou !)",
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
function sendBG(payload){
  return new Promise((resolve,reject)=>{
    chrome.runtime.sendMessage({type:"ECHORANK_API_REQUEST",payload},r=>{
      if(chrome.runtime.lastError)return reject(new Error(chrome.runtime.lastError.message));
      if(r?.error)return reject(new Error(r.error));
      resolve(r);
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   OUVRIR RAPPORT COMPLET
══════════════════════════════════════════════════════════════ */
function openFullReport(){
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
  data.thumbScore  =computeThumbScore(data.videoId);
  data.thumbPotential=computeThumbPotential(data.thumbScore);
  data.globalScore =computeGlobalScore(data.seoScore,data.viralScore,data.thumbScore);
  data.ctrEstimated=computeCTR(data.seoScore,data.viralScore,data.thumbScore);
  data.ctrPotential=computeCTR(data.seoPotential,data.viralPotential,Math.min(100,data.thumbScore+15));
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
          <div class="echo-gate-feat">✨ Rapport IA complet</div>
          <div class="echo-gate-feat">📊 Analyse concurrentielle avancée</div>
          <div class="echo-gate-feat">🎯 Titres IA optimisés</div>
          <div class="echo-gate-feat">📈 Scores SEO détaillés</div>
        </div>
        <button class="echo-gate-btn" id="btnGateUpgrade">${T("upgrade_btn")}</button>
        <button class="echo-gate-close" id="btnGateClose">✕ ${T("close")||"Fermer"}</button>
      </div>
    </div>`;
  document.body.appendChild(gate);
  gate.querySelector("#btnGateClose").addEventListener("click",()=>gate.remove());
  gate.querySelector("#echoGateOverlay").addEventListener("click",e=>{if(e.target.id==="echoGateOverlay")gate.remove();});
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
  const thumb=data.thumbScore||60;
  const glob=data.globalScore||Math.round(seo*0.4+viral*0.35+thumb*0.25);
  const seoPot=data.seoPotential||Math.min(100,seo+20);
  const viralPot=data.viralPotential||Math.min(100,viral+25);
  const thumbPot=data.thumbPotential||Math.min(100,thumb+15);
  const globPot=Math.round(seoPot*0.4+viralPot*0.35+thumbPot*0.25);
  const ctr=data.ctrEstimated||parseFloat((2+(seo/100)*3+(viral/100)*2.5+(thumb/100)*2).toFixed(1));
  const ctrPot=data.ctrPotential||parseFloat((ctr*1.5).toFixed(1));
  const tLen=(data.title||"").length;
  const dLen=data.descLength||0;
  const sc=scoreColor,gc=scoreColor(glob),ss=scoreColor(seo),sv=scoreColor(viral),st=scoreColor(thumb);

  const chk=[
    {ok:tLen>=45&&tLen<=75, label:T("cl_len_label"), gain:18, fix:`${tLen} car. → 55–70`},
    {ok:/\d/.test(data.title||""), label:T("cl_num_label"), gain:8, fix:T("viral_add_num")||"Ajouter un chiffre"},
    {ok:/amazing|best|free|secret|viral|gratuit|incroyable|ultime/.test((data.title||"").toLowerCase()), label:T("cl_em_label"), gain:12, fix:T("viral_add_em")||"Ajouter mot émotionnel"},
    {ok:/^(comment|pourquoi|why|how|\d)/i.test(data.title||"")||/[?]/.test(data.title||""), label:T("cl_hk_label"), gain:18, fix:T("viral_add_hook")||"Ajouter hook CTR"},
    {ok:dLen>=300, label:T("cl_desc_label"), gain:10, fix:`${dLen} car. → 500+`},
    {ok:/[?!]/.test(data.title||""), label:T("cl_punct_label"), gain:5, fix:"Ajouter ? ou !"},
  ];
  const okChk=chk.filter(c=>c.ok);
  const fixChk=chk.filter(c=>!c.ok);
  const totGain=fixChk.reduce((a,c)=>a+c.gain,0);
  const keywords=(data.title||"").split(/\s+/).filter(w=>w.length>3);
  const missingKw=(T("missing_kw_list")||"tuto,gratuit,complet,2024,débutant,guide").split(",").filter(w=>w&&!(data.title||"").toLowerCase().includes(w.toLowerCase()));
  const viralLevel=viral>=70?T("viral_high"):viral>=45?T("viral_medium"):T("viral_low");
  const fakeComp=[
    {title:(data.title||"").slice(0,30)+" — Guide Complet",views:"2.4M",score:78,kw:["guide","complet"],why:"Hook fort + miniature"},
    {title:"5 "+(data.title||"").slice(0,25),views:"890K",score:71,kw:["5","astuces"],why:"Chiffre + émotion"},
    {title:"Comment "+(data.title||"").slice(0,25),views:"340K",score:65,kw:["comment","tuto"],why:"CTR hook fort"},
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
            <button class="erm-act-btn" id="ermPrint" title="Print">🖨</button>
            <button class="erm-act-btn" id="ermCopy" title="Copy">📋</button>
            <button class="erm-act-btn danger" id="ermClose" title="Close">✕</button>
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
              <strong>Score ${glob}/100</strong> — Potentiel viral <strong>${viralLevel}</strong>.
              ${fixChk.length>0?`En corrigeant ${fixChk.length} point(s), le score peut atteindre <strong>${globPot}/100</strong> (+${globPot-glob} pts), CTR : <strong>${ctr}% → ${ctrPot}%</strong>.`:`${T("seo_all_ok")||"Tous les critères validés."}` }
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
                  <div class="erm-sp-item"><span style="color:${st}">${thumb}/100</span><span>${T("thumb_current")||"Actuel"}</span></div>
                  <div class="erm-sp-item"><span style="color:#22c55e">${thumbPot}/100</span><span>${T("thumb_potential")||"Potentiel"}</span></div>
                </div>
              </div>
              <div>
                ${[
                  {k:"curiosity",v:Math.floor(40+Math.random()*50),c:"#7c6dfa"},
                  {k:"surprise",v:Math.floor(20+Math.random()*55),c:"#3b82f6"},
                  {k:"desire",v:Math.floor(30+Math.random()*45),c:"#ec4899"},
                  {k:"urgency",v:Math.floor(15+Math.random()*50),c:"#ef4444"},
                  {k:"trust",v:Math.floor(40+Math.random()*40),c:"#22c55e"},
                ].map(e=>`<div class="erm-progress-row">
                  <span class="erm-progress-label">${T("emotion_"+e.k)||e.k}</span>
                  <div class="erm-progress-bar"><div class="erm-progress-fill" style="width:${e.v}%;background:${e.c}"></div></div>
                  <span class="erm-progress-val" style="color:${e.c}">${e.v}%</span>
                </div>`).join("")}
                <div style="margin-top:8px;font-size:11px;color:#888">
                  ${T("ctr_current")||"CTR actuel"}: <strong style="color:${st}">${parseFloat((ctr*0.6).toFixed(1))}%</strong>
                  → ${T("ctr_pot")||"Potentiel"}: <strong style="color:#22c55e">${parseFloat((ctrPot*0.6).toFixed(1))}%</strong>
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
            <div class="erm-section-title">🚀 Top 10 Actions</div>
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
SEO: ${seo}/100 · Viral: ${viral}/100 · Miniature: ${thumb}/100 · Global: ${glob}/100
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
function renderOverview(data,scores,checklist){
  const sc=scoreColor(scores.seo);
  const vc=scoreColor(scores.viral);
  const tc=scoreColor(scores.thumb);
  const gc=scoreColor(scores.global||Math.round((scores.seo+scores.viral+scores.thumb)/3));
  const global=scores.global||Math.round((scores.seo+scores.viral+scores.thumb)/3);
  const ctr=scores.ctr||computeCTR(scores.seo,scores.viral,scores.thumb);
  const okCount=checklist.filter(c=>c.status==="ok").length;
  const fixCount=checklist.filter(c=>c.status==="fix").length;
  const totalGain=checklist.filter(c=>c.status==="fix"&&c.gain).map(c=>parseInt(c.gain)||0).reduce((a,b)=>a+b,0);

  return `
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
        <div class="echo-score-num" style="color:${tc}">${scores.thumb}</div>
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

    ${currentPlan==="free"?`
    <div class="echo-upgrade-bar">
      <span>${T("upgrade_msg")}</span>
      <button class="echo-upgrade-btn">${T("upgrade_btn")}</button>
    </div>`:""}

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
  const missingKw=T("missing_kw_list").split(",").filter(w=>w&&!(data.title||"").toLowerCase().includes(w.toLowerCase()));
  const recommended=["tuto","guide","complet","2024","débutant","gratuit","facile","rapide"].filter(w=>!keywords.map(k=>k.toLowerCase()).includes(w));

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
        <div class="echo-card-head">${T("seo_suggestions")} <span class="echo-badge echo-badge-ai">IA</span></div>
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
        <div style="margin-top:8px;font-size:11px;color:#888">Ajouter ces mots-clés dans le titre ou la description peut améliorer la visibilité dans les recherches similaires.</div>
      </div>`:``}

      <!-- Mots-clés recommandés -->
      <div class="echo-card">
        <div class="echo-card-head">${T("seo_tab_rec_kw")||"Mots-clés recommandés"}</div>
        <div class="echo-kw-table">
          ${recommended.slice(0,6).map(w=>`
            <div class="echo-kw-row">
              <span class="echo-kw-word">${esc(w)}</span>
              <div class="echo-kw-bars">
                <div class="echo-kw-bar" style="width:${Math.floor(40+Math.random()*55)}%;background:#7c6dfa"></div>
              </div>
              <span class="echo-kw-impact echo-badge echo-badge-amber">${["Élevé","Moyen","Très élevé"][Math.floor(Math.random()*3)]}</span>
            </div>`).join("")}
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
  const emotions=[
    {name:T("emotion_curiosity"),val:Math.floor(40+Math.random()*50),color:"#7c6dfa"},
    {name:T("emotion_surprise"),val:Math.floor(20+Math.random()*60),color:"#3b82f6"},
    {name:T("emotion_desire"),val:Math.floor(30+Math.random()*40),color:"#ec4899"},
    {name:T("emotion_urgency"),val:Math.floor(10+Math.random()*50),color:"#ef4444"},
    {name:T("emotion_trust"),val:Math.floor(40+Math.random()*40),color:"#22c55e"},
  ];
  const checks=[
    {ok:true,label:T("thumb_contrast"),detail:T("thumb_good_contrast")},
    {ok:scores.thumb>65,label:T("thumb_text"),detail:scores.thumb>65?T("thumb_good_text"):T("thumb_bad_text")},
    {ok:true,label:T("format_standard"),detail:T("thumb_format")},
    {ok:false,label:T("thumb_face"),detail:T("thumb_face_proxy")},
  ];
  return `
    <div class="echo-score-hero">
      <div class="echo-score-hero-num" style="color:${tc}">${scores.thumb}/100</div>
      <div class="echo-score-hero-label">${T("thumb_score")}</div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">${T("thumb_preview")}</div>
      <img src="${data.thumb}" onerror="this.src='${thumbHD}'" class="echo-thumb-full">
      <div class="echo-thumb-actions">
        <a href="${thumbHD}" target="_blank" class="echo-mini-btn">⬇ ${T("thumb_download")}</a>
        <button class="echo-mini-btn" onclick="navigator.clipboard.writeText('${thumbHD}');this.textContent='✓';setTimeout(()=>this.textContent='📋 ${T("thumb_copy_url")}',1500)">📋 ${T("thumb_copy_url")}</button>
      </div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">${T("thumb_emotions")}</div>
      ${emotions.map(e=>`
        <div class="echo-emotion-row">
          <span class="echo-emotion-label">${e.name}</span>
          ${progressBar(e.val,e.color)}
          <span class="echo-emotion-val" style="color:${e.color}">${e.val}%</span>
        </div>`).join("")}
    </div>
    <div class="echo-card">
      <div class="echo-card-head">${T("thumb_strengths")} / ${T("thumb_weaknesses")}</div>
      ${checks.map(c=>`
        <div class="echo-check-row">
          <span class="echo-check-dot ${c.ok?"ok":"fix"}"></span>
          <div style="flex:1"><div class="echo-check-text">${c.label}</div><div class="echo-check-sub">${c.detail}</div></div>
        </div>`).join("")}
    </div>
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
      <div class="echo-card-head">Score viral potentiel</div>
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
      <div class="echo-card-head">${T("viral_prediction")} <span class="echo-badge echo-badge-ai">IA</span></div>
      <button class="echo-action-btn purple" id="btnViralAI">${T("btn_viral_ai")}</button>
    </div>
  `;
}

/* ─── COMPETITOR TAB ────────────────────────────────────────── */
function renderCompetitor(data,scores){
  const keywords=(data.title||"").split(/\s+/).filter(w=>w.length>3);
  const missing=T("missing_kw_list").split(",").filter(w=>w&&!data.title.toLowerCase().includes(w.toLowerCase()));
  return `
    <div class="echo-card">
      <div class="echo-card-head">${T("comp_position")}</div>
      <div class="echo-comp-scores">
        <div class="echo-comp-score"><span style="color:${scoreColor(scores.seo)}">${scores.seo}/100</span><span>${T("score_seo")}</span></div>
        <div class="echo-comp-score"><span style="color:${scoreColor(scores.viral)}">${scores.viral}/100</span><span>${T("score_viral")}</span></div>
        <div class="echo-comp-score"><span style="color:${scoreColor(scores.thumb)}">${scores.thumb}/100</span><span>${T("score_thumb")}</span></div>
      </div>
    </div>
    <div class="echo-card">
      <div class="echo-card-head">${T("comp_keywords")}</div>
      <div class="echo-tag-cloud">${keywords.map(w=>`<span class="echo-kw-tag">${esc(w)}</span>`).join("")}</div>
    </div>
    ${missing.length>0?`
    <div class="echo-card">
      <div class="echo-card-head">${T("comp_missing")}</div>
      <div class="echo-tag-cloud">${missing.map(w=>`<span class="echo-kw-tag missing">${esc(w)}</span>`).join("")}</div>
    </div>`:""}
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
    <div class="echo-card">
      <div class="echo-card-head">${T("comp_note")}</div>
      <div class="echo-info-box">${T("comp_pro_note")}</div>
    </div>
  `;
}

/* ─── TITLES TAB ────────────────────────────────────────────── */
function renderTitles(){
  return `
    <div class="echo-card" id="card-titles-content">
      <div class="echo-card-head">${T("nav_titles")} <span class="echo-badge echo-badge-ai">IA</span></div>
      <button class="echo-action-btn blue" id="btnLoadTitles">${T("titles_generate")}</button>
    </div>
    <div class="echo-card" id="card-titles-types">
      <div class="echo-card-head">Types de titres</div>
      <div class="echo-title-types">
        ${[
          {key:"titles_seo",icon:"📈"},
          {key:"titles_ctr",icon:"🎯"},
          {key:"titles_viral",icon:"🔥"},
          {key:"titles_shorts",icon:"📱"},
          {key:"titles_trending",icon:"✨"},
        ].map(t=>`<div class="echo-title-type-pill">${t.icon} ${T(t.key)}</div>`).join("")}
      </div>
    </div>
  `;
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
function createPanel(){
  if(!isVideoPage()){
    const old=document.getElementById("echo-rank-panel");
    if(old){old.remove();panelMounted=false;}
    return;
  }
  const data=getVideoData();
  if(!data)return;
  if(panelMounted&&data.videoId===currentVideoId)return;

  const old=document.getElementById("echo-rank-panel");
  if(old)old.remove();
  panelMounted=false;

  const target=document.querySelector("#secondary-inner")||document.querySelector("#secondary");
  if(!target){setTimeout(createPanel,2000);return;}

  /* ── Vérifier si l'utilisateur est connecté ── */
  if(!currentUserToken || !currentUserEmail){
    // Afficher un petit banner de connexion au lieu du panel
    const banner=document.createElement("div");
    banner.id="echo-rank-panel";
    banner.style.cssText="background:#1a1a2e;border:1px solid #333;border-radius:8px;padding:16px;text-align:center;margin-bottom:12px";
    banner.innerHTML=`
      <p style="color:#aaa;font-size:14px;margin:0 0 12px;">Connectez-vous pour utiliser VidSpark AI</p>
      <a href="https://vidsparkpro.com/dashboard.html" target="_blank" style="background:#7c6dfa;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;font-size:13px">Se connecter →</a>
    `;
    target.prepend(banner);
    panelMounted=true;
    return;
  }

  currentVideoId=data.videoId;

  const seoScore    =computeSEOScore(data.title,data.descLength);
  const viralScore  =computeViralScore(data.title,data.descLength,seoScore);
  const thumbScore  =computeThumbScore(data.videoId);
  const globalScore =computeGlobalScore(seoScore,viralScore,thumbScore);
  const ctrEstimated=computeCTR(seoScore,viralScore,thumbScore);
  const scores      ={seo:seoScore,viral:viralScore,thumb:thumbScore,global:globalScore,ctr:ctrEstimated,
                      seoPot:computeSEOPotential(data.title,data.descLength),
                      viralPot:computeViralPotential(data.title,data.descLength,seoScore)};
  const checklist =buildChecklist(data.title,data.descLength);

  const langOpts=LANG_LIST.map(l=>
    `<option value="${l.code}" ${l.code===currentLanguage?"selected":""}>${l.label}</option>`
  ).join("");

  const TABS=["overview","seo","thumbnail","viral","competitor","titles","actions"];

  const panel=document.createElement("div");
  panel.id="echo-rank-panel";
  if(data.isShort)panel.classList.add("echo-shorts-mode");

  panel.innerHTML=`
    <div class="echo-header">
      <div class="echo-header-left">
        <span class="echo-logo">⚡</span>
        <div><h1>VidSpark AI</h1><p>YouTube SEO Intelligence</p></div>
      </div>
      <div class="echo-header-right">
        <span class="echo-plan-badge ${currentPlan}">${T("plan_"+currentPlan)}</span>
        <select class="echo-lang-select" id="echoLangSelect">${langOpts}</select>
        ${currentUserAvatar?`<img class="echo-user-avatar" src="${currentUserAvatar}" alt="${currentUserName}" title="${currentUserName}">`:
          `<a href="https://vidsparkpro.com/dashboard.html" target="_blank" class="echo-login-link" title="Se connecter">👤</a>`}
      </div>
    </div>

    <img class="echo-thumb" src="${data.thumb}" alt="">

    <div class="echo-tab-bar-wrap">
      <div class="echo-tab-bar" id="echoTabBar">
        ${TABS.map(tab=>`
          <button class="echo-tab-btn ${tab===activeTab?"active":""}" data-tab="${tab}">
            ${T("nav_"+tab)}
          </button>`).join("")}
      </div>
    </div>

    <div class="echo-tab-content" id="echoTabContent">
      ${renderTabContent(activeTab,data,scores,checklist)}
    </div>
  `;

  if(data.isShort){
    panel.classList.add("echo-shorts-mode");
    document.body.appendChild(panel);
    addShortsToggle(panel);
  } else {
    target.prepend(panel);
  }
  panelMounted=true;

  /* ── RTL ARABE ── */
  if(currentLanguage==="ar"){
    panel.setAttribute("dir","rtl");
    panel.classList.add("echo-rtl");
  } else {
    panel.removeAttribute("dir");
    panel.classList.remove("echo-rtl");
  }

  bindPanelEvents(panel,data,scores,checklist);
}

function renderTabContent(tab,data,scores,checklist){
  switch(tab){
    case "overview":   return renderOverview(data,scores,checklist);
    case "seo":        return renderSEO(data,scores,checklist);
    case "thumbnail":  return renderThumbnail(data,scores);
    case "viral":      return renderViral(data,scores);
    case "competitor": return renderCompetitor(data,scores);
    case "titles":     return renderTitles();
    case "actions":    return renderActions(data);
    default:           return renderOverview(data,scores,checklist);
  }
}

function switchTab(tab,data,scores,checklist){
  activeTab=tab;
  const content=document.getElementById("echoTabContent");
  if(content) content.innerHTML=renderTabContent(tab,data,scores,checklist);
  document.querySelectorAll(".echo-tab-btn").forEach(b=>{
    b.classList.toggle("active",b.dataset.tab===tab);
  });
  bindTabEvents(tab,data,scores,checklist);
}

/* ── Bind global panel events ── */
function bindPanelEvents(panel,data,scores,checklist){
  /* langue */
  panel.querySelector("#echoLangSelect").addEventListener("change",function(){
    currentLanguage=this.value;
    chrome.storage.local.set({echoLanguage:currentLanguage});
    panelMounted=false; currentVideoId=null;
    createPanel();
    showToast(T("lang_changed")+" : "+LANG_LIST.find(l=>l.code===currentLanguage)?.label);
  });

  /* onglets */
  panel.querySelectorAll(".echo-tab-btn").forEach(btn=>{
    btn.addEventListener("click",()=>switchTab(btn.dataset.tab,data,scores,checklist));
  });

  bindTabEvents(activeTab,data,scores,checklist);
}

/* ── Bind events spécifiques à chaque onglet ── */
function bindTabEvents(tab,data,scores,checklist){
  const content=document.getElementById("echoTabContent");
  if(!content)return;

  /* Rapport complet (overview + actions) */
  content.querySelector("#btnFullReport")?.addEventListener("click",openFullReport);
  content.querySelector("#btnFullReport2")?.addEventListener("click",openFullReport);

  /* Bouton Passer à Pro */
  content.querySelector(".echo-upgrade-btn")?.addEventListener("click",()=>{
    window.open("https://vidsparkpro.com/pricing.html","_blank");
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
      setContent("card-seo-ai",`
        <div class="echo-card-head">${T("seo_suggestions")} <span class="echo-badge echo-badge-ai">IA</span></div>
        <div class="echo-ai-insight">${esc(res.viral_reason||"Analyse générée.")}</div>
        ${items}
        ${suggs?`<div style="margin-top:8px">${suggs}</div>`:""}
        <div style="margin-top:8px;font-size:20px;font-weight:800;color:${scoreColor(res.score||scores.seo)}">${res.score||scores.seo}/100</div>`);
    }catch(e){setContent("card-seo-ai",errHTML(e.message));}
  });

  /* Viral IA */
  content.querySelector("#btnViralAI")?.addEventListener("click",async()=>{
    setContent("card-viral-ai",spinnerHTML());
    try{
      const res=await sendBG({action:"seo_report",videoId:data.videoId,title:data.title,description:data.description,language:currentLanguage});
      setContent("card-viral-ai",`
        <div class="echo-card-head">${T("viral_prediction")} <span class="echo-badge echo-badge-ai">IA</span></div>
        <div class="echo-ai-insight">${esc(res.viral_reason||"Analyse IA générée.")}</div>
        <div style="margin-top:8px;font-size:18px;font-weight:800;color:${scoreColor(res.viral_score||scores.viral)}">${T("viral_score")} : ${res.viral_score||scores.viral}/100</div>`);
    }catch(e){setContent("card-viral-ai",errHTML(e.message));}
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
      setContent("card-titles-content",`
        <div class="echo-card-head">${T("nav_titles")} <span class="echo-badge echo-badge-ai">IA</span></div>
        ${html}`);
      content.querySelectorAll(".echo-copy-mini").forEach(b=>{
        b.addEventListener("click",()=>{
          navigator.clipboard.writeText(b.closest(".echo-title-result").dataset.title);
          showToast(T("copied_title"));
        });
      });
    }catch(e){setContent("card-titles-content",errHTML(e.message));}
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
function addShortsToggle(panel){
  let btn=document.getElementById("echo-shorts-toggle");
  if(!btn){
    btn=document.createElement("button");
    btn.id="echo-shorts-toggle";
    btn.textContent="⚡";
    btn.title="VidSpark AI";
    document.body.appendChild(btn);
  }
  btn.style.display="none";
  const close=document.createElement("button");
  close.className="echo-shorts-close";
  close.textContent="✕";
  close.addEventListener("click",()=>{panel.style.display="none";btn.style.display="flex";});
  panel.appendChild(close);
  btn.addEventListener("click",()=>{panel.style.display="block";btn.style.display="none";});
}

/* ══════════════════════════════════════════════════════════════
   BOOTSTRAP
══════════════════════════════════════════════════════════════ */
chrome.storage.local.get(["echoLanguage","userPlan","userEmail","userAvatar","userName","userToken"],result=>{
  if(result.echoLanguage)currentLanguage=result.echoLanguage;
  if(result.userPlan)currentPlan=result.userPlan;
  if(result.userEmail)currentUserEmail=result.userEmail;
  if(result.userAvatar)currentUserAvatar=result.userAvatar;
  if(result.userName)currentUserName=result.userName;
  if(result.userToken){
    currentUserToken = result.userToken;
    console.log('[VidSpark] User auto-loaded from storage:', { email: result.userEmail, plan: result.userPlan });
  }
  createPanel();
  setTimeout(createPanel,2500);
  setTimeout(createPanel,5000);
  setInterval(()=>{
    const cur=location.href;
    const vid=extractVideoId();
    if(cur!==lastUrl||(vid&&vid!==currentVideoId)){
      lastUrl=cur;panelMounted=false;currentVideoId=null;
      setTimeout(createPanel,800);
      setTimeout(createPanel,2000);
    }
  },500);
});

/* ══════════════════════════════════════════════════════════════
   ÉCOUTER LES CHANGEMENTS DE STORAGE (mises à jour auth)
══════════════════════════════════════════════════════════════ */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if(areaName !== 'local')return;
  // Si le plan ou l'email change, recharger le panel
  if(changes.userPlan || changes.userEmail || changes.userToken){
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
