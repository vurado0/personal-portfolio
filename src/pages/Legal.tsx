import type { ReactNode } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useContent } from '../lib/content';
import { Seo } from '../lib/head';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-mono text-lg font-bold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-fg/90">{children}</div>
    </section>
  );
}

// TODO(legal): replace every placeholder in [brackets] with your real details before going live.
export function Impressum() {
  const site = useContent().content.profile;
  return (
    <>
      <Seo title="Impressum" path="/impressum" />
      <PageHeader label="legal" title="Impressum">
        Offenlegung gemäß § 25 MedienG und Informationspflicht gemäß § 5 ECG.
      </PageHeader>
      <div className="container-page max-w-3xl space-y-8 pt-10">
        <Section title="Medieninhaber & Herausgeber">
          <p>
            {site.name}
            <br />
            [Straße Hausnummer]
            <br />
            [PLZ] {site.location.split(',')[0]}, Österreich
          </p>
          <p>
            E-Mail: <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
        </Section>
        <Section title="Blattlinie">
          <p>Private, nicht-kommerzielle Website: Portfolio, IT-Wissenssammlung und persönlicher Blog von {site.name}.</p>
        </Section>
        <Section title="Haftung für Inhalte und Links">
          <p>
            Die Inhalte wurden mit Sorgfalt erstellt; für Richtigkeit, Vollständigkeit und Aktualität wird keine Gewähr übernommen. Für Inhalte
            externer Links sind ausschließlich deren Betreiber verantwortlich.
          </p>
        </Section>
        <Section title="Urheberrecht">
          <p>Texte und Fotos stammen, sofern nicht anders angegeben, von {site.name}. Weiterverwendung nur mit Zustimmung.</p>
        </Section>
      </div>
    </>
  );
}

export function Datenschutz() {
  const site = useContent().content.profile;
  return (
    <>
      <Seo title="Datenschutz" path="/datenschutz" />
      <PageHeader label="legal" title="Datenschutzerklärung">
        Informationen zur Verarbeitung personenbezogener Daten gemäß Art. 13 DSGVO.
      </PageHeader>
      <div className="container-page max-w-3xl space-y-8 pt-10">
        <Section title="Verantwortlicher">
          <p>
            {site.name}, [Adresse], E-Mail: <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
        </Section>
        <Section title="Keine Tracking-Cookies">
          <p>
            Diese Website setzt keine Tracking- oder Marketing-Cookies und bindet keine Analyse-Tools ein. Schriftarten werden lokal ausgeliefert, es
            werden keine Anfragen an Google Fonts gestellt. Gespeichert wird lokal im Browser (localStorage) nur Ihre Auswahl für Hell/Dunkel-Modus und
            Feed-Layout sowie ein Zeitstempel zur Begrenzung von Kontaktanfragen.
          </p>
        </Section>
        <Section title="Hosting: Vercel">
          <p>
            Die Website wird bei Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA) gehostet. Beim Aufruf werden technisch notwendige Daten
            (IP-Adresse, Datum/Uhrzeit, abgerufene URL, User-Agent) in Server-Logs verarbeitet, um die Website sicher bereitzustellen (Art. 6 Abs. 1 lit. f
            DSGVO). Die Übermittlung in die USA erfolgt auf Grundlage des EU-US Data Privacy Framework bzw. von Standardvertragsklauseln.
          </p>
        </Section>
        <Section title="Firebase (Google): Datenbank und Anmeldung">
          <p>
            Feed-Beiträge und Kontaktnachrichten werden in Google Firebase / Cloud Firestore (Google Ireland Ltd., Gordon House, Barrow Street, Dublin 4,
            Irland; Speicherort EU) gespeichert. Beim Laden des Feeds wird Ihre IP-Adresse technisch bedingt an Google übermittelt. Die Anmeldung (Firebase
            Authentication) wird ausschließlich vom Betreiber der Website genutzt; Besucher benötigen kein Konto.
          </p>
        </Section>
        <Section title="Cloudinary: Bildauslieferung">
          <p>
            Fotos im Feed werden über Cloudinary Ltd. (Israel / USA) gespeichert und ausgeliefert. Dabei wird Ihre IP-Adresse an Cloudinary übermittelt
            (Art. 6 Abs. 1 lit. f DSGVO). Hochgeladene Fotos werden vorher von Standortdaten (EXIF/GPS) befreit.
          </p>
        </Section>
        <Section title="Spotify und SoundCloud (nur nach Klick)">
          <p>
            Musik-Beiträge zeigen zunächst nur eine lokale Vorschau. Erst wenn Sie auf „Play preview“ klicken, wird der Player von Spotify AB (Schweden)
            bzw. SoundCloud Global Ltd. (Deutschland) geladen; dabei werden Ihre IP-Adresse und ggf. Cookies dieser Anbieter verarbeitet (Einwilligung, Art.
            6 Abs. 1 lit. a DSGVO). Ohne Klick findet keine Verbindung statt.
          </p>
        </Section>
        <Section title="Kontaktformular">
          <p>
            Wenn Sie das Kontaktformular nutzen, werden Name, E-Mail-Adresse und Nachricht in Cloud Firestore gespeichert, um Ihre Anfrage zu beantworten
            (Art. 6 Abs. 1 lit. b bzw. f DSGVO). Die Daten werden gelöscht, sobald die Anfrage erledigt ist.
          </p>
        </Section>
        <Section title="Ihre Rechte">
          <p>
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Beschwerden können Sie an die
            Österreichische Datenschutzbehörde (dsb.gv.at) richten.
          </p>
        </Section>
      </div>
    </>
  );
}
