import { useTranslation } from 'react-i18next';
import { Lock, PenLine, RefreshCw, Wrench, MapPin, Shield, MessageCircle, Star, ClipboardCheck, CalendarDays } from 'lucide-react';
import './Fonctionnalites.css';

var PREFIX = 'landingPage.featuresSection.';

// Icônes de la grille, dans l'ordre des textes (landingPage.featuresSection.grille).
var ICONES = [Lock, PenLine, RefreshCw, Wrench, MapPin, Shield, MessageCircle, Star, ClipboardCheck, CalendarDays];

function Entete(props) {
  return <div className="fn-mini-h"><span className="fn-mini-t">{props.titre}</span><span className="fn-ex">{props.exemple}</span></div>;
}

export default function Fonctionnalites() {
  var t = useTranslation('public').t;
  var ex = t(PREFIX + 'exemple');
  var V = PREFIX + 'vedettes.';

  return (
    <div className="fn">
      <div className="fn-vedettes">
        <article className="fn-vd">
          <div className="fn-vi" aria-hidden="true">
            <div className="fn-mini">
              <span className="fn-alerte">{t(V + '0.mini.rappel')}</span>
              <Entete titre={t(V + '0.mini.titre')} exemple={ex} />
              <div className="fn-row"><span>{t(V + '0.mini.m1')}</span><span className="fn-pl ok">{t(V + '0.mini.paye')}</span></div>
              <div className="fn-row"><span>{t(V + '0.mini.m2')}</span><span className="fn-pl lt">{t(V + '0.mini.retard')}</span></div>
              <div className="fn-row"><span>{t(V + '0.mini.m3')}</span><span className="fn-pl av">{t(V + '0.mini.avenir')}</span></div>
            </div>
          </div>
          <h3>{t(V + '0.titre')}</h3>
          <p>{t(V + '0.desc')}</p>
        </article>

        <article className="fn-vd">
          <div className="fn-vi" aria-hidden="true">
            <div className="fn-mini">
              <Entete titre={t(V + '1.mini.titre')} exemple={ex} />
              <div className="fn-chart">
                {[40, 55, 48, 70, 62, 90].map(function(h, i) { return <span className="fn-bar" key={i}><i style={{ '--h': h + '%' }} /></span>; })}
              </div>
              <span className="fn-pdf">{t(V + '1.mini.export')}</span>
            </div>
          </div>
          <h3>{t(V + '1.titre')}</h3>
          <p>{t(V + '1.desc')}</p>
        </article>

        <article className="fn-vd">
          <div className="fn-vi" aria-hidden="true">
            <div className="fn-mini">
              <Entete titre={t(V + '2.mini.titre')} exemple={ex} />
              <div className="fn-row"><span>{t(V + '2.mini.b1')}</span><span className="fn-pl ok">{t(V + '2.mini.loue')}</span></div>
              <div className="fn-row"><span>{t(V + '2.mini.b2')}</span><span className="fn-pl rs">{t(V + '2.mini.reserve')}</span></div>
              <div className="fn-row"><span>{t(V + '2.mini.b3')}</span><span className="fn-pl av">{t(V + '2.mini.libre')}</span></div>
              <div className="fn-team"><span>AB</span><span>MD</span><span>IS</span></div>
            </div>
          </div>
          <h3>{t(V + '2.titre')}</h3>
          <p>{t(V + '2.desc')}</p>
        </article>
      </div>

      <div className="fn-grille">
        {ICONES.map(function(Icone, i) {
          return (
            <div className="fn-sm" key={i}>
              <span className="fn-ic"><Icone size={18} strokeWidth={1.8} aria-hidden="true" /></span>
              <div><b>{t(PREFIX + 'grille.' + i + '.titre')}</b><span className="d">{t(PREFIX + 'grille.' + i + '.desc')}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
