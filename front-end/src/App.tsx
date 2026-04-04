const stats = [
  { value: '19', label: 'modules prêts' },
  { value: '4', label: 'zones UI' },
  { value: '1', label: 'base TypeScript' },
];

const features = [
  {
    title: 'Interface modulable',
    description: 'Blocs réutilisables, layouts fluides et transitions pensées pour des écrans très visuels.',
  },
  {
    title: 'Architecture claire',
    description: 'Front et back séparés pour itérer vite sans perdre la lisibilité du projet.',
  },
  {
    title: 'Fondation scalable',
    description: 'Une base propre pour brancher auth, API, données live et futures pages produit.',
  },
];

const activity = [
  'Pulse room connected',
  'Theme engine initialized',
  'Animated panels ready',
  'API handshake online',
];

function App() {
  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />

      <header className="topbar">
        <div>
          <p className="eyebrow">Nightcord web app</p>
          <h1>Discord-like, mais pensé comme un produit premium.</h1>
        </div>
        <a className="pill" href="#contact">Préparer le build</a>
      </header>

      <main className="layout">
        <section className="hero card">
          <div className="hero-copy">
            <span className="tag">TypeScript + React + Vite</span>
            <h2>Une base front ultra flexible pour des UI fun, vivantes et très custom.</h2>
            <p>
              J’ai préparé une structure claire pour passer d’un simple site statique à une vraie web app avec un front moderne et un back séparé.
            </p>
            <div className="actions">
              <a className="cta primary" href="#features">Voir l’architecture</a>
              <a className="cta secondary" href="#status">Voir l’état</a>
            </div>
          </div>

          <div className="hero-panel" id="status">
            <div className="panel-shell">
              <div className="panel-top">
                <span />
                <span />
                <span />
              </div>
              <div className="panel-body">
                <div className="command-line">
                  <span className="cursor" />
                  <span>nightcord / live preview</span>
                </div>
                <div className="mini-grid">
                  {stats.map((item) => (
                    <article key={item.label} className="mini-card">
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </article>
                  ))}
                </div>
                <ul className="activity-list">
                  {activity.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-grid" id="features">
          {features.map((feature, index) => (
            <article key={feature.title} className="card feature-card">
              <p className="feature-index">0{index + 1}</p>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="card roadmap" id="contact">
          <div>
            <p className="eyebrow">Next step</p>
            <h3>Brancher le vrai contenu produit, les données live et l’auth ensuite.</h3>
          </div>
          <p>
            La fondation est prête pour construire un site plus ambitieux, avec des écrans riches comme sur un produit premium.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;