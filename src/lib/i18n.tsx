import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "no" | "en";

const translations = {
  // Common
  "common.loading": { no: "Laster...", en: "Loading..." },
  "common.save": { no: "Lagre", en: "Save" },
  "common.saving": { no: "Lagrer...", en: "Saving..." },
  "common.cancel": { no: "Avbryt", en: "Cancel" },
  "common.delete": { no: "Slett", en: "Delete" },
  "common.deleting": { no: "Sletter...", en: "Deleting..." },
  "common.edit": { no: "Rediger", en: "Edit" },
  "common.create": { no: "Opprett", en: "Create" },
  "common.update": { no: "Oppdater", en: "Update" },
  "common.search": { no: "Søk...", en: "Search..." },
  "common.submit": { no: "Send inn", en: "Submit" },
  "common.back": { no: "Tilbake", en: "Back" },
  "common.all": { no: "Alle", en: "All" },
  "common.tools": { no: "Verktøy", en: "Tools" },
  "common.models": { no: "Modeller", en: "Models" },
  "common.unknown": { no: "Ukjent", en: "Unknown" },
  "common.error": { no: "Feil", en: "Error" },
  "common.none": { no: "Ingen", en: "None" },
  "common.saved": { no: "Lagret", en: "Saved" },
  "common.deleted": { no: "Slettet", en: "Deleted" },
  "common.delete_confirm": { no: "Dette kan ikke angres.", en: "This cannot be undone." },

  // Statuses
  "status.allowed": { no: "Tillatt", en: "Allowed" },
  "status.not_allowed": { no: "Ikke tillatt", en: "Not allowed" },
  "status.trial": { no: "Prøveperiode", en: "Trial" },
  "status.set_status": { no: "Sett status", en: "Set status" },
  "status.all_statuses": { no: "Alle statuser", en: "All statuses" },
  "status.not_classified": { no: "Ikke klassifisert", en: "Not classified" },
  "status.updated": { no: "Status oppdatert", en: "Status updated" },
  "status.only_admin": { no: "Kun admin kan endre status", en: "Only admin can change status" },

  // Nav
  "nav.home": { no: "Hjem", en: "Home" },
  "nav.survey": { no: "Kartlegging", en: "Survey" },
  "nav.insights": { no: "Innsikt", en: "Insights" },
  "nav.stack": { no: "Anbefalt Stack", en: "Recommended Stack" },
  "nav.catalog": { no: "Katalog", en: "Catalog" },
  "nav.learning": { no: "Læring", en: "Learning" },
  "nav.admin": { no: "Admin", en: "Admin" },

  // Index page
  "index.welcome_back": { no: "Velkommen tilbake,", en: "Welcome back," },
  "index.what_today": { no: "Hva vil du gjøre i dag?", en: "What would you like to do today?" },
  "index.survey_desc": { no: "Del hvilke AI-verktøy du bruker", en: "Share which AI tools you use" },
  "index.insights_desc": { no: "Se hva organisasjonen bruker", en: "See what the organization uses" },
  "index.stack_desc": { no: "Se anbefalte verktøy", en: "See recommended tools" },
  "index.catalog_desc": { no: "Utforsk verktøykatalogen", en: "Explore the tool catalog" },
  "index.learning_desc": { no: "Tips, prompter og case studies", en: "Tips, prompts and case studies" },
  "index.no_tracking": { no: "Ingen sporing. Ingen innlogging. Helt anonymt.", en: "No tracking. No login. Fully anonymous." },
  "index.no_tracking_short": { no: "Ingen sporing · Ingen innlogging · Helt anonymt", en: "No tracking · No login · Fully anonymous" },
  "index.share_anonymous": { no: "Del hvilke AI-verktøy du bruker – helt anonymt", en: "Share which AI tools you use – fully anonymous" },
  "index.choose_nickname": { no: "Velg et kallenavn", en: "Choose a nickname" },
  "index.nickname_desc": { no: "Du trenger ikke logge inn. Velg et kallenavn så vi kan koble svarene dine. Ingen personopplysninger lagres.", en: "No login required. Choose a nickname so we can link your answers. No personal data is stored." },
  "index.your_nickname": { no: "Ditt kallenavn", en: "Your nickname" },
  "index.generate_new": { no: "Generer nytt", en: "Generate new" },
  "index.get_started": { no: "Kom i gang", en: "Get started" },

  // Survey page
  "survey.title": { no: "Kartlegging", en: "Survey" },
  "survey.subtitle": { no: "Del hvilke AI-verktøy og modeller du bruker (~5 min)", en: "Share which AI tools and models you use (~5 min)" },
  "survey.which_tools": { no: "Hvilke AI-verktøy bruker du?", en: "Which AI tools do you use?" },
  "survey.select_or_write": { no: "Velg fra listen og/eller skriv inn egne", en: "Select from the list and/or write your own" },
  "survey.other_tools": { no: "Andre verktøy (kommaseparert)", en: "Other tools (comma-separated)" },
  "survey.which_models": { no: "Hvilke AI-modeller bruker du?", en: "Which AI models do you use?" },
  "survey.what_for": { no: "Hva bruker du AI til?", en: "What do you use AI for?" },
  "survey.time_saved": { no: "Hvor mye tid sparer du per uke med AI?", en: "How much time do you save per week with AI?" },
  "survey.sensitive_data": { no: "Har du lagt inn sensitiv/kundedata i AI-verktøy?", en: "Have you entered sensitive/customer data into AI tools?" },
  "survey.pain_points": { no: "Hva fungerer dårlig i dag?", en: "What works poorly today?" },
  "survey.pain_placeholder": { no: "Beskriv utfordringer du møter med AI-verktøy...", en: "Describe challenges you face with AI tools..." },
  "survey.must_keep": { no: "Viktigste verktøy du ikke vil miste?", en: "Most important tool you don't want to lose?" },
  "survey.submit_survey": { no: "Send inn kartlegging", en: "Submit survey" },
  "survey.submitting": { no: "Sender inn...", en: "Submitting..." },
  "survey.thanks": { no: "Takk for ditt bidrag!", en: "Thank you for your contribution!" },
  "survey.recorded": { no: "Svarene dine er registrert anonymt.", en: "Your answers have been recorded anonymously." },
  "survey.see_insights": { no: "Se innsikt", en: "See insights" },
  "survey.explore_catalog": { no: "Utforsk katalogen", en: "Explore catalog" },
  "survey.need_nickname": { no: "Du må velge et kallenavn først", en: "You must choose a nickname first" },
  "survey.submit_error": { no: "Feil ved innsending", en: "Error submitting" },
  "survey.dont_know": { no: "Vet ikke", en: "Don't know" },

  // Use case options
  "usecase.coding": { no: "Koding", en: "Coding" },
  "usecase.documentation": { no: "Dokumentasjon", en: "Documentation" },
  "usecase.analysis": { no: "Analyse", en: "Analysis" },
  "usecase.customer_dialog": { no: "Kundedialog", en: "Customer dialog" },
  "usecase.design": { no: "Design / Media", en: "Design / Media" },
  "usecase.automation": { no: "Automatisering", en: "Automation" },

  // Time saved options
  "time.0": { no: "0 timer", en: "0 hours" },
  "time.1-2": { no: "1–2 timer", en: "1–2 hours" },
  "time.3-5": { no: "3–5 timer", en: "3–5 hours" },
  "time.5+": { no: "5+ timer", en: "5+ hours" },

  // Sensitivity options
  "sensitivity.never": { no: "Aldri", en: "Never" },
  "sensitivity.unsure": { no: "Usikker", en: "Unsure" },
  "sensitivity.yes": { no: "Ja", en: "Yes" },

  // Insights page
  "insights.title": { no: "Innsikt", en: "Insights" },
  "insights.subtitle": { no: "Aggregert statistikk fra {count} innleveringer", en: "Aggregated statistics from {count} submissions" },
  "insights.most_used_tools": { no: "Mest brukte verktøy", en: "Most used tools" },
  "insights.most_used_models": { no: "Mest brukte modeller", en: "Most used models" },
  "insights.use_cases": { no: "Bruksområder", en: "Use cases" },
  "insights.time_saved": { no: "Tidsbesparelse per uke", en: "Time saved per week" },
  "insights.data_risk": { no: "Sensitiv data-risiko", en: "Sensitive data risk" },

  // Stack page
  "stack.title": { no: "Anbefalt Stack", en: "Recommended Stack" },
  "stack.subtitle": { no: "Organisasjonens anbefalte AI-verktøy og modeller", en: "The organization's recommended AI tools and models" },
  "stack.no_items": { no: "Ingen elementer er evaluert ennå.", en: "No items have been evaluated yet." },
  "stack.see_details": { no: "Se detaljer og veiledning →", en: "See details and guidance →" },

  // Catalog page
  "catalog.title": { no: "Verktøykatalog", en: "Tool Catalog" },
  "catalog.subtitle": { no: "Komplett oversikt over alle AI-verktøy og modeller", en: "Complete overview of all AI tools and models" },
  "catalog.search": { no: "Søk i katalogen...", en: "Search the catalog..." },
  "catalog.filter_status": { no: "Filtrer status", en: "Filter status" },
  "catalog.add_tool": { no: "Legg til verktøy", en: "Add tool" },
  "catalog.add_model": { no: "Legg til modell", en: "Add model" },
  "catalog.no_tools": { no: "Ingen verktøy funnet.", en: "No tools found." },
  "catalog.no_models": { no: "Ingen modeller funnet.", en: "No models found." },

  // Tool/Model detail
  "detail.loading": { no: "Laster...", en: "Loading..." },
  "detail.tool_not_found": { no: "Verktøy ikke funnet.", en: "Tool not found." },
  "detail.model_not_found": { no: "Modell ikke funnet.", en: "Model not found." },
  "detail.best_for": { no: "Best for", en: "Best for" },
  "detail.example_prompts": { no: "Eksempelprompter", en: "Example prompts" },
  "detail.do_this": { no: "Gjør dette", en: "Do this" },
  "detail.avoid_this": { no: "Unngå dette", en: "Avoid this" },
  "detail.security": { no: "Sikkerhetsveiledning", en: "Security guidance" },
  "detail.notes": { no: "Notater", en: "Notes" },

  // Learning page
  "learning.title": { no: "Læring", en: "Learning" },
  "learning.subtitle": { no: "Tips, prompter, retningslinjer og case studies", en: "Tips, prompts, guidelines and case studies" },
  "learning.share_tip": { no: "Del et tips", en: "Share a tip" },
  "learning.share_dialog_title": { no: "Del ditt tips eller workflow", en: "Share your tip or workflow" },
  "learning.content_placeholder": { no: "Innhold (støtter markdown)", en: "Content (supports markdown)" },
  "learning.add_tag": { no: "Legg til tag og trykk Enter", en: "Add tag and press Enter" },
  "learning.submitted": { no: "Innsendt!", en: "Submitted!" },
  "learning.submitted_desc": { no: "Ditt bidrag vil bli gjennomgått av admin.", en: "Your contribution will be reviewed by admin." },
  "learning.no_content": { no: "Ingen innhold ennå.", en: "No content yet." },
  "learning.type.tip": { no: "Tips", en: "Tips" },
  "learning.type.show-tell": { no: "Show & Tell", en: "Show & Tell" },
  "learning.type.prompt-pack": { no: "Prompt-pakke", en: "Prompt pack" },
  "learning.type.guideline": { no: "Retningslinje", en: "Guideline" },
  "learning.type.case-study": { no: "Case Study", en: "Case Study" },
  "learning.filter_type": { no: "Type", en: "Type" },
  "learning.filter_tag": { no: "Emneknagger", en: "Tags" },
  "learning.tab.content": { no: "Innhold", en: "Content" },
  "learning.tab.links": { no: "Lenker", en: "Links" },
  "learning.share_link": { no: "Del en lenke", en: "Share a link" },
  "learning.share_link_dialog": { no: "Del en lenke fra en annen app", en: "Share a link from another app" },
  "learning.link_url": { no: "URL", en: "URL" },
  "learning.link_url_placeholder": { no: "https://...", en: "https://..." },
  "learning.link_title": { no: "Tittel (valgfritt)", en: "Title (optional)" },
  "learning.link_description": { no: "Beskrivelse (valgfritt)", en: "Description (optional)" },
  "learning.link_submitted": { no: "Lenke innsendt!", en: "Link submitted!" },
  "learning.link_submitted_desc": { no: "Lenken vil bli gjennomgått av admin.", en: "The link will be reviewed by admin." },
  "learning.no_links": { no: "Ingen lenker delt ennå.", en: "No links shared yet." },
  "learning.invalid_url": { no: "Ugyldig URL", en: "Invalid URL" },

  // Admin - shared links
  "admin.shared_links": { no: "Delte lenker", en: "Shared Links" },
  "admin.no_links": { no: "Ingen lenker funnet.", en: "No links found." },
  "admin.link_approved": { no: "Lenke godkjent", en: "Link approved" },
  "admin.link_rejected": { no: "Lenke avvist og slettet", en: "Link rejected and deleted" },
  "admin.pending": { no: "Venter", en: "Pending" },
  "admin.published": { no: "Publisert", en: "Published" },
  "admin.approve": { no: "Godkjenn", en: "Approve" },
  "admin.reject": { no: "Avvis", en: "Reject" },
  "admin.filter_links": { no: "Alle lenker", en: "All links" },
  "admin.pending_only": { no: "Ventende", en: "Pending" },
  "admin.published_only": { no: "Publiserte", en: "Published" },

  // Admin page
  "admin.title": { no: "Admin Panel", en: "Admin Panel" },
  "admin.enter_code": { no: "Skriv inn admin-koden for tilgang", en: "Enter admin code for access" },
  "admin.code_placeholder": { no: "Admin-kode", en: "Admin code" },
  "admin.login": { no: "Logg inn", en: "Log in" },
  "admin.wrong_code": { no: "Feil kode", en: "Wrong code" },
  "admin.submissions": { no: "Innleveringer", en: "Submissions" },
  "admin.evaluations": { no: "Evalueringer", en: "Evaluations" },
  "admin.bulk_title": { no: "Bulk AI-generering av katalogoppføringer", en: "Bulk AI generation of catalog entries" },
  "admin.bulk_desc": { no: "Generer kataloginnhold automatisk for alle verktøy og modeller som mangler oppføring.", en: "Automatically generate catalog content for all tools and models missing entries." },
  "admin.gen_tools": { no: "Generer for verktøy", en: "Generate for tools" },
  "admin.gen_models": { no: "Generer for modeller", en: "Generate for models" },
  "admin.gen_all": { no: "Generer for alle", en: "Generate for all" },
  "admin.running": { no: "Kjører...", en: "Running..." },
  "admin.search_submissions": { no: "Søk i innleveringer...", en: "Search submissions..." },
  "admin.export_csv": { no: "Eksporter CSV", en: "Export CSV" },
  "admin.csv_exported": { no: "CSV eksportert", en: "CSV exported" },
  "admin.no_submissions": { no: "Ingen innleveringer funnet.", en: "No submissions found." },
  "admin.submission_deleted": { no: "Innlevering slettet", en: "Submission deleted" },
  "admin.delete_submission": { no: "Slett innlevering", en: "Delete submission" },
  "admin.new_evaluation": { no: "Ny evaluering", en: "New evaluation" },
  "admin.edit_evaluation": { no: "Rediger evaluering", en: "Edit evaluation" },
  "admin.evaluation_updated": { no: "Evaluering oppdatert", en: "Evaluation updated" },
  "admin.evaluation_created": { no: "Evaluering opprettet", en: "Evaluation created" },
  "admin.evaluation_deleted": { no: "Evaluering slettet", en: "Evaluation deleted" },
  "admin.no_evaluations": { no: "Ingen evalueringer funnet.", en: "No evaluations found." },
  "admin.select_entity": { no: "Velg verktøy eller modell", en: "Select tool or model" },
  "admin.select_tool": { no: "Velg verktøy", en: "Select tool" },
  "admin.select_model": { no: "Velg modell", en: "Select model" },
  "admin.value": { no: "Verdi", en: "Value" },
  "admin.risk": { no: "Risiko", en: "Risk" },
  "admin.cost": { no: "Kostnad", en: "Cost" },
  "admin.rationale": { no: "Begrunnelse", en: "Rationale" },
  "admin.rationale_placeholder": { no: "Begrunnelse / notater for beslutningen...", en: "Rationale / notes for the decision..." },
  "admin.decided": { no: "Besluttet", en: "Decided" },
  "admin.eval_history": { no: "Evalueringshistorikk", en: "Evaluation history" },
  "admin.all_types": { no: "Alle typer", en: "All types" },
  "admin.team": { no: "Team", en: "Team" },
  "admin.role": { no: "Rolle", en: "Role" },
  "admin.freetext": { no: "Fritekst", en: "Freetext" },
  "admin.challenges": { no: "Utfordringer", en: "Challenges" },
  "admin.must_keep": { no: "Må beholde", en: "Must keep" },
  "admin.time_saved": { no: "Tid spart", en: "Time saved" },
  "admin.sensitive_data": { no: "Sensitiv data", en: "Sensitive data" },

  // Submission Analytics
  "admin.analytics_title": { no: "Beslutningsstøtte", en: "Decision Support" },
  "admin.analytics_desc": { no: "Aggregert analyse av innleveringer for å prioritere klassifisering", en: "Aggregated submission analysis to prioritize classification" },
  "admin.total_responses": { no: "Svar totalt", en: "Total responses" },
  "admin.saves_5h": { no: "Sparer 5t+", en: "Saves 5h+" },
  "admin.data_risk_count": { no: "Datarisiko", en: "Data risk" },
  "admin.needs_review": { no: "Trenger vurdering", en: "Needs review" },
  "admin.unclassified": { no: "uklassifiserte", en: "unclassified" },
  "admin.action_needed": { no: "Krever handling – populære men uklassifiserte", en: "Action needed – popular but unclassified" },
  "admin.mentions": { no: "nevnelser", en: "mentions" },
  "admin.must_keep_short": { no: "må-ha", en: "must-keep" },
  "admin.classify": { no: "Klassifiser", en: "Classify" },
  "admin.tool_ranking": { no: "Verktøy etter popularitet", en: "Tools by popularity" },
  "admin.model_ranking": { no: "Modeller etter popularitet", en: "Models by popularity" },
  "admin.freetext_tools": { no: "Verktøy fra fritekst (ikke i katalogen)", en: "Freetext tools (not in catalog)" },
  "admin.freetext_desc": { no: "Disse verktøyene ble nevnt i fritekstfeltet men finnes ikke i katalogen ennå", en: "These tools were mentioned in freetext but are not in the catalog yet" },
  "admin.pain_points_title": { no: "Utfordringer rapportert", en: "Reported pain points" },
  "admin.show_less": { no: "Vis færre", en: "Show less" },
  "admin.show_all": { no: "Vis alle ({count})", en: "Show all ({count})" },

  // Evaluation Dashboard
  "admin.eval_dashboard_title": { no: "Evalueringsoversikt", en: "Evaluation Overview" },
  "admin.eval_dashboard_desc": { no: "Status for alle verktøy og modeller – evaluer direkte herfra", en: "Status for all tools and models – evaluate directly from here" },
  "admin.evaluated_count": { no: "vurdert", en: "evaluated" },
  "admin.complete": { no: "fullført", en: "complete" },
  "admin.remaining": { no: "gjenstår", en: "remaining" },
  "admin.unclassified_label": { no: "Uklassifisert", en: "Unclassified" },
  "admin.has_catalog": { no: "Har katalog", en: "Has catalog" },
  "admin.search_items": { no: "Søk verktøy og modeller...", en: "Search tools and models..." },
  "admin.sort_popularity": { no: "Etter popularitet", en: "By popularity" },
  "admin.sort_status": { no: "Etter status", en: "By status" },
  "admin.sort_name": { no: "Etter navn", en: "By name" },
  "admin.items_shown": { no: "elementer", en: "items" },
  "admin.no_items_found": { no: "Ingen elementer funnet.", en: "No items found." },
  "admin.submission_context": { no: "Fra innleveringer", en: "From submissions" },
  "admin.of_respondents": { no: "av respondenter", en: "of respondents" },
  "admin.from_submissions": { no: "Fra innleveringer", en: "From submissions" },
  "admin.marked_must_keep": { no: "markert som må-ha", en: "marked as must-keep" },
  "admin.current_evaluation": { no: "Gjeldende evaluering", en: "Current evaluation" },
  "admin.not_yet_evaluated": { no: "Ikke evaluert ennå", en: "Not yet evaluated" },
  "admin.has_catalog_entry": { no: "Har katalogoppføring", en: "Has catalog entry" },
  "admin.no_catalog_entry": { no: "Mangler katalogoppføring", en: "Missing catalog entry" },
  "admin.high_is_good": { no: "høy er bra", en: "high is good" },
  "admin.high_is_bad": { no: "høy er dårlig", en: "high is bad" },

  // User menu
  "user.admin_active": { no: "Admin-modus aktiv", en: "Admin mode active" },
  "user.login_admin": { no: "Logg inn som admin", en: "Log in as admin" },
  "user.logout_admin": { no: "Logg ut av admin", en: "Log out of admin" },
  "user.switch_user": { no: "Bytt bruker / nullstill", en: "Switch user / reset" },
  "user.not_logged_in": { no: "Ikke innlogget", en: "Not logged in" },

  // StatusEditor
  "status_editor.title": { no: "Klassifisering", en: "Classification" },
  "status_editor.status": { no: "Status", en: "Status" },
  "status_editor.select": { no: "Velg status...", en: "Select status..." },
  "status_editor.rationale": { no: "Begrunnelse (valgfritt)", en: "Rationale (optional)" },
  "status_editor.rationale_placeholder": { no: "Kort begrunnelse for valgt status...", en: "Brief rationale for chosen status..." },
  "status_editor.save": { no: "Lagre klassifisering", en: "Save classification" },
  "status_editor.saved": { no: "Klassifisering lagret!", en: "Classification saved!" },
  "status_editor.select_error": { no: "Velg en status", en: "Select a status" },

  // Delete dialog
  "delete.title": { no: "Slett {name}?", en: "Delete {name}?" },
  "delete.description": { no: "Dette vil permanent slette «{name}» og kan ikke angres. Tilhørende evalueringer og katalogoppføringer vil også bli påvirket.", en: "This will permanently delete \"{name}\" and cannot be undone. Associated evaluations and catalog entries will also be affected." },

  // Form dialogs
  "form.name": { no: "Navn", en: "Name" },
  "form.name_required": { no: "Navn er påkrevd", en: "Name is required" },
  "form.fill_name_first": { no: "Fyll inn navn først", en: "Fill in name first" },
  "form.provider": { no: "Leverandør", en: "Provider" },
  "form.modality": { no: "Modalitet", en: "Modality" },
  "form.category": { no: "Kategori", en: "Category" },
  "form.link": { no: "Lenke", en: "Link" },
  "form.notes": { no: "Notater", en: "Notes" },
  "form.notes_placeholder": { no: "Valgfrie notater...", en: "Optional notes..." },
  "form.catalog_entry": { no: "Katalogoppføring", en: "Catalog entry" },
  "form.fill_ai": { no: "Fyll med AI", en: "Fill with AI" },
  "form.generating": { no: "Genererer...", en: "Generating..." },
  "form.ai_ready": { no: "AI-generert innhold klart!", en: "AI-generated content ready!" },
  "form.ai_error": { no: "Kunne ikke generere innhold", en: "Could not generate content" },
  "form.save_error": { no: "Kunne ikke lagre", en: "Could not save" },
  "form.new_tool": { no: "Nytt verktøy", en: "New tool" },
  "form.edit_tool": { no: "Rediger verktøy", en: "Edit tool" },
  "form.new_model": { no: "Ny modell", en: "New model" },
  "form.edit_model": { no: "Rediger modell", en: "Edit model" },
  "form.tool_created": { no: "Verktøy opprettet", en: "Tool created" },
  "form.tool_updated": { no: "Verktøy oppdatert", en: "Tool updated" },
  "form.model_created": { no: "Modell opprettet", en: "Model created" },
  "form.model_updated": { no: "Modell oppdatert", en: "Model updated" },

  // 404
  "notfound.title": { no: "Siden ble ikke funnet", en: "Page not found" },
  "notfound.go_home": { no: "Gå til forsiden", en: "Return to Home" },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("no");

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const entry = translations[key];
      if (!entry) return key;
      let text: string = entry[lang] || entry["no"];
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
