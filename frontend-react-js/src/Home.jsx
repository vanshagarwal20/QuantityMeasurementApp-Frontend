import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ruler, Scale, Thermometer, Beaker, LogOut, LogIn, UserPlus } from 'lucide-react';
import { addHistoryItem, getUserHistory } from './auth';
import { qmaApi } from './api/qmaApi';

const MEASUREMENTS = {
  Length: { Kilometer: 1000, Meter: 1, Centimeter: 0.01, Millimeter: 0.001, Mile: 1609.34, Yard: 0.9144, Foot: 0.3048, Inch: 0.0254 },
  Weight: { Kilogram: 1, Gram: 0.001, Milligram: 0.000001, Tonne: 1000, Pound: 0.453592, Ounce: 0.0283495 },
  Temperature: { Celsius: 'C', Fahrenheit: 'F', Kelvin: 'K' },
  Volume: { Liter: 1, Milliliter: 0.001, Gallon: 3.78541 }
};

const TYPES = [
  { id: 'Length', icon: Ruler },
  { id: 'Weight', icon: Scale },
  { id: 'Temperature', icon: Thermometer },
  { id: 'Volume', icon: Beaker }
];

const ACTIONS = ['Conversion', 'Comparison', 'Arithmetic'];
const ARITHMETIC_OPERATORS = ['+', '-', '*', '/'];

function convertTemp(val, fromUnit, toUnit) {
  if (fromUnit === toUnit) return val;
  let c = val;
  if (fromUnit === 'Fahrenheit') c = (val - 32) * 5 / 9;
  if (fromUnit === 'Kelvin') c = val - 273.15;
  if (toUnit === 'Celsius') return c;
  if (toUnit === 'Fahrenheit') return (c * 9 / 5) + 32;
  if (toUnit === 'Kelvin') return c + 273.15;
  return 0;
}

function convertValue(val, type, fromUnit, toUnit) {
  if (val === '' || isNaN(val)) return '';
  const num = parseFloat(val);
  if (type === 'Temperature') {
    return parseFloat(convertTemp(num, fromUnit, toUnit).toFixed(4));
  } else {
    const fromFactor = MEASUREMENTS[type][fromUnit];
    const toFactor = MEASUREMENTS[type][toUnit];
    return parseFloat(((num * fromFactor) / toFactor).toFixed(4));
  }
}

function Home({ isAuthenticated, user, onLogout }) {
  const [activeType, setActiveType] = useState('Length');
  const [activeAction, setActiveAction] = useState('Conversion');
  const [historyItems, setHistoryItems] = useState([]);
  const [lastSavedDetail, setLastSavedDetail] = useState('');

  const [units, setUnits] = useState(Object.keys(MEASUREMENTS.Length));

  const [unit1, setUnit1] = useState('Kilometer');
  const [unit2, setUnit2] = useState('Meter');
  const [val1, setVal1] = useState(1);
  const [val2, setVal2] = useState('');

  const [operator, setOperator] = useState('+');
  const [resultUnit, setResultUnit] = useState('Meter');

  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      setHistoryItems([]);
      setLastSavedDetail('');
      return;
    }

    setHistoryItems(getUserHistory(user.email));
  }, [isAuthenticated, user]);

  useEffect(() => {
    const availableUnits = Object.keys(MEASUREMENTS[activeType]);
    setUnits(availableUnits);
    setUnit1(availableUnits[0]);
    setUnit2(availableUnits[1] || availableUnits[0]);
    setResultUnit(availableUnits[0]);
    setVal1(1);
    setVal2(activeAction === 'Conversion' ? '' : 1);
  }, [activeType, activeAction]);

  useEffect(() => {
    if (activeAction !== 'Conversion' || val1 === '') return;

    const token = localStorage.getItem('qm_jwt_token');

    const payload = {
      thisQuantity: {
        value: parseFloat(val1),
        unit: unit1.toUpperCase(),
        measurementType: activeType
      },
      thatQuantity: {
        value: 0,
        unit: unit2.toUpperCase(),
        measurementType: activeType
      }
    };

    // ✅ IF LOGGED IN → BACKEND
    if (token) {
      qmaApi.convert(payload)
        .then(({ data }) => setVal2(data.result))
        .catch(() => {
          // fallback to local if backend fails
          const localResult = convertValue(val1, activeType, unit1, unit2);
          setVal2(localResult);
        });
    }
    // ✅ IF NOT LOGGED IN → LOCAL
    else {
      const localResult = convertValue(val1, activeType, unit1, unit2);
      setVal2(localResult);
    }

  }, [val1, unit1, unit2, activeType, activeAction]);

  // For arithmetic and comparison, call qmaApi.add/subtract/multiply/divide/compare
  // with the same payload structure. The result field contains the answer.


  // Auto-save operation when details change
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    if (activeAction === 'History') return;

    const detail = getOperationDetail();
    if (!detail) return;
    if (detail === lastSavedDetail) return;

    addHistoryItem(user.email, {
      label: `${activeType} ${activeAction}`,
      detail,
    });

    setHistoryItems(getUserHistory(user.email));
    setLastSavedDetail(detail);
  }, [val1, val2, unit1, unit2, operator, activeType, activeAction, resultUnit, isAuthenticated, user, lastSavedDetail]);

  const handleVal1Change = (e) => setVal1(e.target.value);
  const handleVal2Change = (e) => setVal2(e.target.value);

  const getOperationDetail = () => {
    if (activeAction === 'History') return '';

    if (activeAction === 'Conversion') {
      if (val1 === '' || val2 === '') return '';
      return `${val1} ${unit1} -> ${val2} ${unit2}`;
    }

    if (val1 === '' || val2 === '') return '';

    if (activeAction === 'Arithmetic') {
      const result = getResult();
      if (result === '-' || result === null) return '';
      return `${val1} ${unit1} ${operator} ${val2} ${unit2} = ${result} ${resultUnit}`;
    }

    return getResult() || '';
  };

  const getResult = () => {
    if (activeAction === 'Conversion' || activeAction === 'History') return null;

    if (val1 === '' || val2 === '') return '-';

    // Convert both values to resultUnit to perform action
    const v1 = convertValue(val1, activeType, unit1, resultUnit);
    const v2 = convertValue(val2, activeType, unit2, resultUnit);

    if (activeAction === 'Arithmetic') {
      if (operator === '/' && v2 === 0) return 'Cannot divide by 0';

      let res = 0;
      if (operator === '+') res = v1 + v2;
      if (operator === '-') res = v1 - v2;
      if (operator === '*') res = v1 * v2;
      if (operator === '/') res = v1 / v2;

      return parseFloat(res.toFixed(4));
    }

    if (activeAction === 'Comparison') {
      if (v1 > v2) return `${val1} ${unit1} is Greater than ${val2} ${unit2}`;
      if (v1 < v2) return `${val1} ${unit1} is Less than ${val2} ${unit2}`;
      return `${val1} ${unit1} is Equal to ${val2} ${unit2}`;
    }
  };

  const historyPreview = [
    { label: 'Length Conversion', detail: '2 Kilometer -> 2000 Meter', at: new Date().toISOString() },
    { label: 'Weight Arithmetic', detail: '5 Kilogram + 750 Gram', at: new Date(Date.now() - 15000).toISOString() },
    { label: 'Temperature Compare', detail: '100 Celsius > 212 Fahrenheit', at: new Date(Date.now() - 30000).toISOString() }
  ];

  const displayActions = isAuthenticated ? [...ACTIONS, 'History'] : ACTIONS;

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveAction('Conversion'); // ✅ force reset after logout
    }
  }, [isAuthenticated]);

  const formatHistoryTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString();
  };

  return (
    <div className="container animate-slide-up">
      <div className="header" style={{ borderRadius: '0.5rem', marginBottom: '1.5rem', position: 'relative' }}>
        <h1>Welcome To Quantity Measurement</h1>

        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <button type="button" onClick={onLogout} className="header-action-btn">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="header-action-btn header-link-btn">
                <LogIn size={16} /> Login
              </Link>
              <Link to="/register" className="header-action-btn header-link-btn">
                <UserPlus size={16} /> Signup
              </Link>
            </>
          )}
        </div>
      </div>

      {!isAuthenticated && (
        <div className="auth-hint">
          To view and save your calculation history, please login or register an account.
        </div>
      )}

      <div className="home-layout">
        <div className="home-main">
          <div className="card">
            <h4 className="input-label mb-2">Choose Type</h4>
            <div className="type-grid">
              {TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    className={`type-btn ${activeType === type.id ? 'active' : ''}`}
                    onClick={() => setActiveType(type.id)}
                  >
                    <div className="icon-wrapper"><Icon size={32} /></div>
                    {type.id}
                  </button>
                )
              })}
            </div>

            <h4 className="input-label mt-8 mb-2">Choose Action</h4>
            <div className="action-tabs" style={{ marginTop: 0 }}>
              {displayActions.map(action => (
                <button
                  key={action}
                  className={`action-tab ${activeAction === action ? 'active' : ''}`}
                  onClick={() => setActiveAction(action)}
                >
                  {action}
                </button>
              ))}
            </div>

            {activeAction === 'History' ? (
              <div className="mt-8">
                <div className="history-list">
                  {(historyItems.length ? historyItems : historyPreview).map((entry, index) => (
                    <button key={(entry.id || entry.label) + index} className="history-item" type="button">
                      <span className="history-item-label">{(entry.label || '').toUpperCase()} {entry.at ? `| ${formatHistoryTime(entry.at)}` : ''}</span>
                      <span className="history-item-detail">{entry.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`mt-8 ${activeAction !== 'Conversion' ? 'flex items-center gap-6 justify-center' : 'grid-2 gap-6'}`}>
                <div className="input-combo" style={activeAction !== 'Conversion' ? { flex: 1 } : {}}>
                  <h4 className="input-label mb-2">{activeAction === 'Conversion' ? 'From' : 'Value 1'}</h4>
                  <input
                    type="number"
                    className="input-field"
                    value={val1}
                    onChange={handleVal1Change}
                  />
                  <select className="select-field" value={unit1} onChange={e => setUnit1(e.target.value)}>
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                {activeAction === 'Arithmetic' && (
                  <button
                    className="operator"
                    onClick={() => {
                      const currentIndex = ARITHMETIC_OPERATORS.indexOf(operator);
                      const nextIndex = (currentIndex + 1) % ARITHMETIC_OPERATORS.length;
                      setOperator(ARITHMETIC_OPERATORS[nextIndex]);
                    }}
                  >
                    {operator}
                  </button>
                )}

                {activeAction === 'Comparison' && (
                  <div className="operator">=</div>
                )}

                <div className="input-combo" style={activeAction !== 'Conversion' ? { flex: 1 } : {}}>
                  <h4 className="input-label mb-2">{activeAction === 'Conversion' ? 'To' : 'Value 2'}</h4>
                  <input
                    type="number"
                    className="input-field"
                    value={activeAction === 'Conversion' ? (val2 || '') : val2}
                    readOnly={activeAction === 'Conversion'}
                    onChange={handleVal2Change}
                  />
                  <select className="select-field" value={unit2} onChange={e => setUnit2(e.target.value)}>
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            )}

            {activeAction !== 'Conversion' && activeAction !== 'History' && (
              <div className="mt-8 result-box">
                <h4 className="input-label">Result</h4>
                {activeAction === 'Arithmetic' ? (
                  <div className="flex items-center gap-4">
                    <span className="result-value">{getResult()}</span>
                    <select
                      className="select-field"
                      style={{ width: '150px', borderRadius: '0.5rem', borderTop: '1px solid var(--border-color)' }}
                      value={resultUnit}
                      onChange={e => setResultUnit(e.target.value)}
                    >
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                ) : (
                  <span className="result-value" style={{ fontSize: '1.25rem' }}>{getResult()}</span>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
