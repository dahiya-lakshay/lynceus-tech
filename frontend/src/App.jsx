import { useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import FlaggedTicker from './components/FlaggedTicker.jsx'
import LiveStatus from './components/LiveStatus.jsx'
import Hero from './components/Hero.jsx'
import EnterpriseKPIs from './components/EnterpriseKPIs.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import ResultPanel from './components/ResultPanel.jsx'
import LiveFeed from './components/LiveFeed.jsx'
import StatCard from './components/StatCard.jsx'
import FeatureImportanceChart from './components/FeatureImportanceChart.jsx'
import ConfusionMatrix from './components/ConfusionMatrix.jsx'
import RecentFlaggedTable from './components/RecentFlaggedTable.jsx'
import ModelLeaderboard from './components/ModelLeaderboard.jsx'
import PrecisionRecallChart from './components/PrecisionRecallChart.jsx'
import PipelineDiagram from './components/PipelineDiagram.jsx'
import SystemArchitecture from './components/SystemArchitecture.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import Footer from './components/Footer.jsx'
import { predictTransaction, getDashboardStats } from './api/client.js'

export default function App() {
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState(null)

  const [result, setResult] = useState(null)
  const [submittedTransaction, setSubmittedTransaction] = useState(null)
  const [predicting, setPredicting] = useState(false)
  const [predictError, setPredictError] = useState(null)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) =>
        setStatsError(
          err?.response?.data?.detail ||
            'Could not reach the API. Is the backend running and is VITE_API_URL set correctly?'
        )
      )
  }, [])

  const handleSubmit = async (transaction) => {
    setPredicting(true)
    setPredictError(null)
    try {
      const data = await predictTransaction(transaction)
      setResult(data)
      setSubmittedTransaction(transaction)
    } catch (err) {
      setPredictError(err?.response?.data?.detail || 'Request failed. Check the API connection.')
      setResult(null)
    } finally {
      setPredicting(false)
    }
  }

  return (
    <div className="min-h-screen bg-ledger-900">
      <CommandPalette />
      <Navbar />
      <LiveStatus />
      <FlaggedTicker transactions={stats?.recent_flagged} />
      <Hero totalTransactions={stats?.total_transactions} fraudRate={stats?.metrics?.fraud_rate} />

      {statsError && (
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/5 px-4 py-3 font-mono text-xs text-signal-amber">
            {statsError}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 pb-4">
        <EnterpriseKPIs stats={stats} />
      </div>

      <section id="live-check" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <div className="mb-10 max-w-xl">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-signal-amber">Live Check</div>
          <h2 className="mt-2 font-display text-3xl font-semibold text-slate-50">
            Score any transaction in real time
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Fill in the details or load a preset scenario. The assessment includes an overall risk
            score, a review decision, risk factors, and the exact features that drove it.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <TransactionForm onSubmit={handleSubmit} loading={predicting} />
          <ResultPanel
            result={result}
            submittedTransaction={submittedTransaction}
            error={predictError}
            loading={predicting}
          />
        </div>
      </section>

      <section id="live-feed" className="border-t border-ledger-700 bg-ledger-950/40">
        <div className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
          <div className="mb-10 max-w-xl">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-signal-amber">Live Feed</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-slate-50">
              Watch the pipeline work on its own
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Start the stream to see transactions scored continuously — the same scoring path a
              Kafka consumer uses in the event-driven deployment.
            </p>
          </div>
          <LiveFeed />
        </div>
      </section>

      <section id="risk-overview" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <div className="mb-10 max-w-xl">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-signal-amber">Risk Overview</div>
          <h2 className="mt-2 font-display text-3xl font-semibold text-slate-50">
            How the model performs on held-out data
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Metrics come from a stratified test split the classifier never trained on, backed by
            5-fold cross-validation across a small model leaderboard.
          </p>
        </div>

        {stats && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                label="ROC-AUC"
                value={stats.metrics.holdout.roc_auc.toFixed(3)}
                sublabel="held-out test split"
                accent="amber"
              />
              <StatCard
                label="Precision"
                value={stats.metrics.holdout.precision.toFixed(3)}
                sublabel="of flagged, truly anomalous"
                accent="teal"
              />
              <StatCard
                label="Recall"
                value={stats.metrics.holdout.recall.toFixed(3)}
                sublabel="of anomalies, caught"
                accent="slate"
              />
              <StatCard
                label="F1 Score"
                value={stats.metrics.holdout.f1.toFixed(3)}
                sublabel="precision / recall balance"
                accent="amber"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ConfusionMatrix matrix={stats.metrics.holdout.confusion_matrix} />
              <FeatureImportanceChart data={stats.feature_importance} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ModelLeaderboard leaderboard={stats.leaderboard} />
              <PrecisionRecallChart
                data={stats.pr_curve}
                selectedThreshold={stats.metrics.holdout.decision_threshold}
              />
            </div>

            <div className="mt-6">
              <RecentFlaggedTable transactions={stats.recent_flagged} />
            </div>
          </>
        )}
      </section>

      <section id="transparency" className="border-t border-ledger-700 bg-ledger-950/40">
        <div className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
          <div className="mb-10 max-w-xl">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-signal-amber">Model Transparency</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-slate-50">
              Three stages, one accountable pipeline
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              No stage of this pipeline is a black box — each one hands the next a specific, inspectable signal.
            </p>
          </div>
          <PipelineDiagram />
        </div>
      </section>

      <section id="architecture" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <div className="mb-10 max-w-xl">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-signal-amber">System Architecture</div>
          <h2 className="mt-2 font-display text-3xl font-semibold text-slate-50">
            Built as an event-driven system, not just a script
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            The REST API and the Kafka streaming path share one scoring pipeline — different entry
            points, identical decision logic.
          </p>
        </div>
        <SystemArchitecture />
      </section>

      <Footer />
    </div>
  )
}
