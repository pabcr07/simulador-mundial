import React, { useState } from 'react';

// --- Base de Datos de Equipos ---
const TEAMS = {
    "Alemania":              {"att": 2.404, "def": 1.029},
    "Arabia Saudita":        {"att": 0.859, "def": 1.708},
    "Argelia":               {"att": 0.920, "def": 1.241},
    "Argentina":             {"att": 1.395, "def": 0.914},
    "Australia":             {"att": 0.670, "def": 1.632},
    "Austria":               {"att": 2.066, "def": 1.197},
    "Belgica":               {"att": 2.286, "def": 1.214},
    "Bosnia":                {"att": 1.328, "def": 1.777},
    "Brasil":                {"att": 1.595, "def": 1.536},
    "Cabo Verde":            {"att": 1.008, "def": 1.362},
    "Canada":                {"att": 1.584, "def": 0.971},
    "Chequia":               {"att": 1.258, "def": 1.411},
    "Colombia":              {"att": 1.399, "def": 1.352},
    "Congo":                 {"att": 1.119, "def": 1.213},
    "Corea":                 {"att": 1.203, "def": 1.106},
    "Costa de Marfil":       {"att": 1.409, "def": 0.783},
    "Croacia":               {"att": 1.770, "def": 1.505},
    "Curazao":               {"att": 0.937, "def": 1.409},
    "Ecuador":               {"att": 1.168, "def": 1.441},
    "EEUU":                  {"att": 1.373, "def": 1.024},
    "Egipto":                {"att": 0.702, "def": 1.630},
    "Escocia":               {"att": 1.128, "def": 1.856},
    "España":                {"att": 2.306, "def": 0.775},
    "Francia":               {"att": 2.026, "def": 0.893},
    "Ghana":                 {"att": 0.932, "def": 1.394},
    "Haiti":                 {"att": 0.824, "def": 1.429},
    "Inglaterra":            {"att": 2.126, "def": 0.718},
    "Irak":                  {"att": 0.715, "def": 1.688},
    "Iran":                  {"att": 1.258, "def": 1.202},
    "Japon":                 {"att": 1.162, "def": 1.326},
    "Jordania":              {"att": 1.020, "def": 1.582},
    "Marruecos":             {"att": 1.155, "def": 0.965},
    "Mexico":                {"att": 1.077, "def": 0.615},
    "Noruega":               {"att": 2.149, "def": 1.277},
    "Nueva Zelanda":         {"att": 0.883, "def": 1.925},
    "Paises Bajos":          {"att": 1.738, "def": 1.228},
    "Panama":                {"att": 1.472, "def": 1.341},
    "Paraguay":              {"att": 0.818, "def": 1.593},
    "Portugal":              {"att": 2.228, "def": 1.136},
    "Qatar":                 {"att": 0.707, "def": 1.900},
    "Senegal":               {"att": 1.185, "def": 1.450},
    "Sudafrica":             {"att": 1.149, "def": 0.997},
    "Suecia":                {"att": 1.190, "def": 1.742},
    "Suiza":                 {"att": 1.482, "def": 1.235},
    "Tunez":                 {"att": 0.855, "def": 1.630},
    "Turquia":               {"att": 1.647, "def": 1.566},
    "Uruguay":               {"att": 1.196, "def": 1.377},
    "Uzbekistan":            {"att": 0.956, "def": 1.544},
}

const AVG_GOALS = 1.33;
const MAX_GOALS = 8; // Reducido levemente para optimizar el frontend
const RHO = -0.055; // Usando el estilo 'balanced' por defecto

// --- Funciones Matemáticas ---
const poissonPmf = (lam, k) => {
  if (lam <= 0) return k === 0 ? 1 : 0;
  let logP = -lam;
  for (let i = 1; i <= k; i++) logP += Math.log(lam) - Math.log(i);
  return Math.exp(logP);
};

const dcAdjustment = (i, j, lamA, lamB, rho) => {
  if (i === 0 && j === 0) return 1 + rho;
  if (i === 1 && j === 0) return 1 - lamB * rho;
  if (i === 0 && j === 1) return 1 - lamA * rho;
  if (i === 1 && j === 1) return 1 + lamA * lamB * rho;
  return 1.0;
};

export default function SimuladorMundial() {
  const [equipoA, setEquipoA] = useState('Argentina');
  const [equipoB, setEquipoB] = useState('Brasil');
  const [resultados, setResultados] = useState(null);

  const simularPartido = () => {
    if (equipoA === equipoB) {
      alert("Por favor, seleccioná dos equipos distintos.");
      return;
    }

    const tA = TEAMS[equipoA];
    const tB = TEAMS[equipoB];

    const lamA = Math.max(0.4, Math.min(3.5, tA.att * tB.def * AVG_GOALS));
    const lamB = Math.max(0.4, Math.min(3.5, tB.att * tA.def * AVG_GOALS));

    let probs = [];
    let metrics = { winA: 0, draw: 0, winB: 0 };
    let totalP = 0;

    // Calcular matriz de probabilidades
    for (let i = 0; i <= MAX_GOALS; i++) {
      for (let j = 0; j <= MAX_GOALS; j++) {
        let p = poissonPmf(lamA, i) * poissonPmf(lamB, j) * dcAdjustment(i, j, lamA, lamB, RHO);
        probs.push({ score: `${i} - ${j}`, p: p, i, j });
        totalP += p;
      }
    }

    // Normalizar y agrupar 1X2
    probs = probs.map(item => {
      let normP = item.p / totalP;
      if (item.i > item.j) metrics.winA += normP;
      else if (item.i === item.j) metrics.draw += normP;
      else metrics.winB += normP;
      return { ...item, p: normP };
    });

    // Ordenar marcadores más probables
    probs.sort((a, b) => b.p - a.p);

    setResultados({
      metrics,
      topScores: probs.slice(0, 5),
      lamA,
      lamB
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-600">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Simulador Mundial 2026
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
            <select 
              value={equipoA} 
              onChange={(e) => setEquipoA(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Object.keys(TEAMS).map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visitante</label>
            <select 
              value={equipoB} 
              onChange={(e) => setEquipoB(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Object.keys(TEAMS).map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <button 
          onClick={simularPartido}
          className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/40 hover:shadow-indigo-500/40 transform hover:-translate-y-1 active:translate-y-0 transition-all duration-200 tracking-wider">
            ⚽ Simular Partido
          </button>
          
        </div>

        {resultados && (
          <div className="mt-8 animate-fade-in-up">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Probabilidades 1X2</h2>
            
            <div className="space-y-3 mb-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{equipoA}</span>
                  <span className="font-bold">{(resultados.metrics.winA * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${resultados.metrics.winA * 100}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Empate</span>
                  <span className="font-bold">{(resultados.metrics.draw * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${resultados.metrics.draw * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{equipoB}</span>
                  <span className="font-bold">{(resultados.metrics.winB * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${resultados.metrics.winB * 100}%` }}></div>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Top 5 Marcadores</h2>
            <ul className="divide-y divide-gray-100">
            {resultados.topScores.map((item, index) => (
            <li key={index} className="py-3 flex justify-between items-center text-gray-700">
            <span className="font-bold text-lg text-gray-800">
              {item.score}
              </span>
            <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-bold shadow-sm">
        {(item.p * 100).toFixed(1)}%
          </span>
        </li>
        ))}
          </ul>
          </div>
        )}
      </div>
    </div>
  );
}