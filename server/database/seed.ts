import bcrypt from 'bcryptjs';
import { getDb, queryOne, run, saveDb } from './db.js';

export async function seedDatabase(): Promise<void> {
  const db = await getDb();

  // Check if admin already exists
  const existingAdmin = await queryOne('SELECT id FROM admins WHERE username = ?', ['admin']);
  if (!existingAdmin) {
    const adminHash = await bcrypt.hash('AdminSecureAI2026!', 10);
    db.run(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      ['admin', adminHash]
    );
    console.log('✓ Admin account seeded (username: admin)');
  }

  // Check if problem statements exist
  const existingProblems = await queryOne('SELECT count(*) as count FROM problem_statements');
  if (!existingProblems || existingProblems.count === 0) {
    const problems = [
      {
        code: 'PS-01',
        title: 'Autonomous Real-Time Edge Vision for Agricultural Pest & Micro-Pathology Triage',
        category: 'Edge AI & Embedded Computer Vision',
        desc: 'Build an ultra-low-power, sub-40ms edge computer vision system deployable on mobile terminals and edge drones. The model must segment foliar micro-pathologies, insect vector clusters, and chlorophyll nitrogen deficiencies in real-time under volatile direct sunlight, wind distortion, and camera motion blur without persistent cloud telemetry.',
        req: '1. Model inference latency strictly under 40ms per frame.\n2. Robustness to sudden luminance changes and shadows.\n3. Dynamic offline caching queue with differential sync.\n4. Real-time multi-target bounding box/segmentation masks with confidence calibration.',
        out: 'Quantized production inference pipeline + live telemetry web application displaying real-time video stream triage and foliar anomaly scoring.',
        eval: 'Inference latency, edge model quantization (INT8/FP16), F1 macro-score under adverse lighting benchmarks, and operator UX responsiveness.'
      },
      {
        code: 'PS-02',
        title: 'Multi-Modal Emergency ICU Patient Risk Prognosis & Audio Synthesis Engine',
        category: 'Healthcare AI & Multimodal Fusion',
        desc: 'Architect a multimodal clinical intelligence pipeline that fuses raw paramedic voice transmissions, dynamic bedside electrocardiogram/SpO2 timeseries, and patient vitals to synthesize actionable prognostic risk vectors and suggest prioritized trauma bay triage allocations before ambulance arrival.',
        req: '1. Cross-attention multimodal fusion across asynchronous audio telemetry and tabular vital streams.\n2. Sub-second risk trajectory prediction with Shapley feature attribution.\n3. Automated HIPAA-compliant de-identification masking of patient PII.\n4. Resilient failover logging for high-concurrency trauma admissions.',
        out: 'Physician ICU Command Console featuring real-time incoming ambulance patient timeline, audio speech-to-text transcript highlights, and automated bed prioritization.',
        eval: 'Clinical risk calibration accuracy, multimodal latency, explainability clarity for emergency clinicians, and system resilience.'
      },
      {
        code: 'PS-03',
        title: 'Autonomous Multi-Agent Zero-Trust Cybersecurity Defense Mesh',
        category: 'Autonomous Multi-Agent Systems & SecOps',
        desc: 'Construct a self-orchestrating swarm of collaborative AI defense agents that ingest distributed eBPF system call logs, VPC flow trajectories, and authorization token streams to identify lateral exploit propagation and execute sub-second containment micro-isolations without halting legitimate core microservices.',
        req: '1. Multi-agent consensus engine (Monitor Agent, Correlator Agent, Mitigation Agent).\n2. Real-time graph neural network representation of attack path progression.\n3. Automated blast-radius impact analysis before policy quarantine.\n4. Cryptographically verifiable tamper-resistant audit event ledger.',
        out: 'Operational SecOps War-Room Console with interactive 3D attack topology visualization, agent conversation trail, and simulated adversary replay.',
        eval: 'Mean-Time-To-Contain (MTTC), false-positive isolation rate, agentic coordination speed under multi-stage simulated intrusions.'
      },
      {
        code: 'PS-04',
        title: 'Sub-Second Geospatial Intelligence & Dynamic Route Optimization for Disaster Evacuation',
        category: 'Spatial Intelligence & Emergency Logistics',
        desc: 'Engineer a mission-critical spatial computing engine that ingests high-resolution disaster aerial satellite/drone feeds alongside citizen SOS telemetry. The engine must dynamically map flood inundations, bridge collapses, and structural debris to compute surviving corridors for rapid rescue deployment.',
        req: '1. Fast raster segmentation overlay onto vector street network graphs.\n2. A*/Contraction Hierarchy pathfinding recalculation in under 200ms when corridors collapse.\n3. Offline-first P2P mesh telemetry packet serialization.\n4. Multi-modal rescue vehicle constraint solver (boats, high-clearance 4x4s, aerial drones).',
        out: 'Interactive Tactical Dispatch Map with real-time route re-planning, road blockage alerts, and distress beacon clustering.',
        eval: 'Graph re-routing latency during sudden network partitioning, rescue corridor efficiency, and map performance under 10k concurrent coordinates.'
      },
      {
        code: 'PS-05',
        title: 'Sparse Neuromorphic Transformer Inference Acceleration for Low-Power Devices',
        category: 'Green Computing & Deep Learning Optimization',
        desc: 'Develop an energy-optimized sparse transformer inference execution runtime that reduces inference power dissipation by over 60% on constrained battery devices through dynamic token routing, selective attention gating, and conditional feedforward activation.',
        req: '1. Dynamic structured sparsity and activation pruning without quality degradation.\n2. Real-time milliwatt-per-token and FLOPs reduction profiler.\n3. Benchmarking telemetry measuring latency, memory bandwidth, and semantic retention.\n4. Comprehensive evaluation against dense baseline models across reasoning benchmarks.',
        out: 'Interactive Compiler Profiling Workbench showing live token generation, layer activation heatmap, and watt/token efficiency graphs.',
        eval: 'Energy reduction ratio (Joules/token), output semantic perplexity retention, and runtime execution speedup.'
      }
    ];

    for (const p of problems) {
      db.run(
        `INSERT INTO problem_statements (problem_code, title, category, description, requirements, expected_output, evaluation_focus, is_revealed)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [p.code, p.title, p.category, p.desc, p.req, p.out, p.eval]
      );
    }
    console.log('✓ 5 Problem statements seeded');

    // Create 4 allocation slots for each of the 5 problems (total 20 slots)
    const allProblems = db.exec('SELECT id, problem_code FROM problem_statements');
    if (allProblems.length > 0 && allProblems[0].values) {
      for (const row of allProblems[0].values) {
        const probId = row[0] as number;
        for (let slot = 1; slot <= 4; slot++) {
          db.run(
            'INSERT INTO allocation_slots (problem_id, slot_number, consumed) VALUES (?, ?, 0)',
            [probId, slot]
          );
        }
      }
      console.log('✓ 20 Problem allocation slots created (4 per problem)');
    }
  }

  // Check if teams exist - do not auto seed 20 fake teams, let admin create them manually
  const existingTeams = await queryOne('SELECT count(*) as count FROM teams');
  if (!existingTeams) {
    // Teams table initialized empty
  }

  // Check hackathon state
  const existingState = await queryOne('SELECT id FROM hackathon_state WHERE id = 1');
  if (!existingState) {
    db.run(
      `INSERT INTO hackathon_state (id, status, start_time, end_time, paused_at, paused_duration, current_phase, problems_revealed)
       VALUES (1, 'SETUP', NULL, NULL, NULL, 0, 'DISCOVER', 0)`
    );
    console.log('✓ Hackathon state initialized (Status: SETUP, Phase: DISCOVER)');
  }

  // Seed welcome announcement if none
  const existingAnnouncements = await queryOne('SELECT count(*) as count FROM announcements');
  if (!existingAnnouncements || existingAnnouncements.count === 0) {
    db.run(
      `INSERT INTO announcements (message) VALUES (?)`,
      ['Welcome to the 8-Hour AI Hackathon organized by Neural Minds Club × AI Innovation Club! Get ready for challenge discovery.']
    );
  }

  saveDb();
}
