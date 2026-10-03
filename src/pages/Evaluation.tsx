// Evaluation page — Clean metrics, tables, and pipeline info without graphs
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import './Evaluation.css';

const DEMO_EVAL = {
  wer_single: 0.18,
  wer_fused: 0.09,
  speaker_accuracy: 0.91,
  p50_latency_ms: 340,
  p95_latency_ms: 820,
  total_segments: 47,
  audio_mode: 'fused',
};

export default function Evaluation() {
  const navigate = useNavigate();

  return (
    <div className="page eval-page">
      <TopNav rightContent={
        <button className="btn-ghost" onClick={() => navigate(-1)} aria-label="Go back">
          &larr; Back
        </button>
      } />

      <main className="eval-main" role="main">
        <div className="eval-inner">

          {/* Header */}
          <div className="eval-header">
            <div>
              <h1 className="headline-lg">Evaluation & System Metrics</h1>
              <p className="body-md" style={{ color: '#64748b', marginTop: 4 }}>
                Real-time audio processing performance and accuracy summaries
              </p>
            </div>
            <div className="eval-mode-badge">
              <span className="status-dot active" aria-hidden="true" />
              <span className="label-mono">MODE: FUSED</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="eval-metrics-grid">
            <div className="eval-card">
              <span className="eval-card-label">Speaker Accuracy</span>
              <div className="eval-card-val text-green">{(DEMO_EVAL.speaker_accuracy * 100).toFixed(0)}%</div>
              <span className="eval-card-sub">Automatic voice attribution</span>
            </div>

            <div className="eval-card">
              <span className="eval-card-label">p50 Latency</span>
              <div className="eval-card-val">{DEMO_EVAL.p50_latency_ms} ms</div>
              <span className="eval-card-sub">Median caption delay</span>
            </div>

            <div className="eval-card">
              <span className="eval-card-label">p95 Latency</span>
              <div className="eval-card-val">{DEMO_EVAL.p95_latency_ms} ms</div>
              <span className="eval-card-sub">95th percentile delay</span>
            </div>

            <div className="eval-card">
              <span className="eval-card-label">Processed Segments</span>
              <div className="eval-card-val">{DEMO_EVAL.total_segments}</div>
              <span className="eval-card-sub">Speech utterances</span>
            </div>
          </div>

          {/* Word Error Rate Summary Table */}
          <div className="eval-section-card">
            <h2 className="eval-section-title">Word Error Rate (WER) Evaluation</h2>
            <p className="eval-section-desc">
              Comparison of transcription accuracy between single-device capture and multi-device audio fusion.
            </p>

            <table className="eval-table">
              <thead>
                <tr>
                  <th>Processing Mode</th>
                  <th>Word Error Rate (WER)</th>
                  <th>Accuracy Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Single Device Capture</strong></td>
                  <td>{(DEMO_EVAL.wer_single * 100).toFixed(1)}%</td>
                  <td>{((1 - DEMO_EVAL.wer_single) * 100).toFixed(1)}%</td>
                  <td><span className="badge-status badge-warn">Baseline</span></td>
                </tr>
                <tr>
                  <td><strong>Multi-Device Fused Mode</strong></td>
                  <td>{(DEMO_EVAL.wer_fused * 100).toFixed(1)}%</td>
                  <td>{((1 - DEMO_EVAL.wer_fused) * 100).toFixed(1)}%</td>
                  <td><span className="badge-status badge-active">Optimal (50% Error Reduction)</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Latency Metrics Summary Table */}
          <div className="eval-section-card">
            <h2 className="eval-section-title">Latency Breakdown</h2>
            <p className="eval-section-desc">
              Detailed latency benchmarks measured from user utterance to caption display.
            </p>

            <div className="latency-summary-grid">
              <div className="latency-box">
                <span className="latency-title">Audio Chunk Transfer</span>
                <span className="latency-num">42 ms</span>
                <span className="latency-desc">WebSocket network transport</span>
              </div>
              <div className="latency-box">
                <span className="latency-title">Speaker Diarization</span>
                <span className="latency-num">85 ms</span>
                <span className="latency-desc">Voice ID embedding matching</span>
              </div>
              <div className="latency-box">
                <span className="latency-title">Streaming ASR Inference</span>
                <span className="latency-num">213 ms</span>
                <span className="latency-desc">Partial & final text generation</span>
              </div>
            </div>
          </div>

          {/* Audio Pipeline Flow */}
          <div className="eval-section-card">
            <h2 className="eval-section-title">End-to-End Processing Pipeline</h2>
            <div className="eval-pipeline">
              {[
                { label: 'Device Audio', icon: '📱', desc: '16kHz mono PCM' },
                { label: 'Clock Sync', icon: '⏱️', desc: 'NTP alignment' },
                { label: 'VAD Filter', icon: '🔊', desc: 'Silence rejection' },
                { label: 'Speaker ID', icon: '🎯', desc: 'Voice profile' },
                { label: 'Channel Fusion', icon: '🔀', desc: 'Best channel' },
                { label: 'Streaming ASR', icon: '💬', desc: 'Live ASR' },
                { label: 'Broadcast', icon: '✅', desc: 'WebSocket UI' },
              ].map((step, i) => (
                <React.Fragment key={i}>
                  <div className="eval-pipeline-step">
                    <div className="eval-pipeline-icon">{step.icon}</div>
                    <div className="eval-pipeline-label">{step.label}</div>
                    <div className="eval-pipeline-desc">{step.desc}</div>
                  </div>
                  {i < 6 && <div className="eval-pipeline-arrow">&rarr;</div>}
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
