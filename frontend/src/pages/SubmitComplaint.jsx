/**
 * SubmitComplaint.jsx — Multi-step complaint submission form
 * Steps: Basic Details → Location + Map → Attachments → Review & Submit
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MapPin, Paperclip, FileText, CheckCircle2, ChevronRight, ChevronLeft, Send, Search, Mic, Square } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import './SubmitComplaint.css';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Map click handler component
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const STEPS = ['Basic Details', 'Location', 'Attachments', 'Review'];
const DISTRICTS = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
  'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi', 'Dindigul', 'Thanjavur',
  'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil',
];

export default function SubmitComplaint() {
  const { user }     = useAuth();
  const { t }        = useLanguage();
  const navigate     = useNavigate();

  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [errors, setErrors]             = useState({});
  const [markerPos, setMarkerPos]       = useState(null);
  const [voiceActive, setVoiceActive]   = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category: '', district: '',
    address: '', pincode: '', lat: null, lng: null,
    isAnonymous: false, language: 'en', voiceTranscript: '',
  });
  const [files, setFiles] = useState([]);

  const recognitionRef = useRef(null);
  const suggestTimeout = useRef(null);

  // AI suggestion on description change
  useEffect(() => {
    if (form.description.length > 30 || form.title.length > 10) {
      clearTimeout(suggestTimeout.current);
      suggestTimeout.current = setTimeout(fetchAISuggestion, 700);
    }
  }, [form.description, form.title]);

  const fetchAISuggestion = async () => {
    setAiLoading(true);
    try {
      const text = `${form.title} ${form.description}`;
      const { data } = await api.post('/complaints/suggest', { text });
      if (data.suggestions?.length > 0) {
        setAiSuggestion(data.suggestions[0]);
      }
    } catch {} finally {
      setAiLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const handleMapClick = (lat, lng) => {
    setMarkerPos([lat, lng]);
    setForm((p) => ({ ...p, lat, lng }));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length + files.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }
    setFiles((p) => [...p, ...selected]);
  };

  const removeFile = (i) => setFiles((p) => p.filter((_, idx) => idx !== i));

  // Voice input
  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser. Please use Google Chrome or Edge.', { style: { borderRadius: 'var(--radius-lg)' } });
      return;
    }
    
    // Save current description so we don't overwrite it
    const existingDesc = form.description ? form.description.trim() + ' ' : '';
    
    const rec = new SpeechRecognition();
    rec.lang = form.language === 'ta' ? 'ta-IN' : 'en-IN';
    rec.continuous = true;
    // Set interim results to true so that we see the text while speaking
    rec.interimResults = true;

    rec.onstart = () => {
      setVoiceActive(true);
      toast.success('Listening... Speak now.', { icon: '🎤', id: 'voice-toast' });
    };
    
    rec.onresult = (e) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        } else {
          interimTranscript += e.results[i][0].transcript;
        }
      }
      
      const currentTranscript = finalTranscript + interimTranscript;
      const newText = existingDesc + currentTranscript;
      
      // Automatically fill the textarea with recognized speech
      setForm((p) => ({ ...p, description: newText, voiceTranscript: newText }));
    };
    
    rec.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      if (e.error === 'not-allowed') {
        toast.error('Microphone permission denied. Please allow microphone access in your browser settings.', { id: 'voice-toast', duration: 4000 });
      } else if (e.error === 'no-speech') {
        // No speech detected, will remain active or timeout depending on browser
      } else {
        toast.error(`Microphone error: ${e.error}`, { id: 'voice-toast' });
      }
      setVoiceActive(false);
    };
    
    rec.onend = () => {
      // It stopped listening natively
      setVoiceActive(false);
      toast.dismiss('voice-toast');
    };
    
    try {
      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.error(err);
      if (err.name === 'NotAllowedError') {
        toast.error('Microphone permission denied. Please check your browser settings.');
      } else if (err.name === 'InvalidStateError') {
        toast.error('Voice input is already running.');
      } else {
        toast.error('Failed to start microphone.');
      }
      setVoiceActive(false);
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
      toast.dismiss('voice-toast');
    }
    setVoiceActive(false);
  };

  const validate = () => {
    const errs = {};
    if (step === 0) {
      if (!form.title.trim() || form.title.length < 5)       errs.title = 'Title must be at least 5 characters.';
      if (!form.description.trim() || form.description.length < 20) errs.description = 'Description must be at least 20 characters.';
    }
    if (step === 1) {
      if (!form.address.trim()) errs.address = 'Address is required.';
      if (!form.district)       errs.district = 'Please select a district.';
    }
    setErrors(errs);
    if(Object.keys(errs).length > 0) {
      toast.error('Please fix errors before proceeding.', { style: { borderRadius: 'var(--radius-xl)' } });
    }
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('language', form.language);
      formData.append('isAnonymous', form.isAnonymous);
      if (form.voiceTranscript) formData.append('voiceTranscript', form.voiceTranscript);

      formData.append('location', JSON.stringify({
        address: form.address,
        district: form.district,
        pincode: form.pincode,
        lat: form.lat,
        lng: form.lng,
      }));

      files.forEach((f) => formData.append('attachments', f));

      const { data } = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(data);
      toast.success('Complaint submitted successfully!');
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Submission failed. Please try again.' });
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <div className="submit-success animate-scale-in">
        <div className="success-icon">🎉</div>
        <h2 className="success-title">Complaint Submitted!</h2>
        <p className="success-subtitle">Your complaint has been received and AI has classified it.</p>

        <div className="success-card">
          <div className="success-row">
            <span>Tracking ID</span>
            <code className="tracking-id" style={{ fontSize: '1rem', padding: '4px 12px' }}>
              {success.complaint.trackingId}
            </code>
          </div>
          <div className="success-row">
            <span>Category</span>
            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{success.aiInfo.category}</span>
          </div>
          <div className="success-row">
            <span>Department</span>
            <span style={{ fontWeight: 600 }}>{success.aiInfo.department}</span>
          </div>
          <div className="success-row">
            <span>Priority</span>
            <StatusBadge status={success.aiInfo.priority} type="priority" />
          </div>
          <div className="success-row">
            <span>AI Confidence</span>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{success.aiInfo.confidence}%</span>
          </div>
          <div className="success-row">
            <span>SLA Deadline</span>
            <span style={{ fontWeight: 600 }}>Within {success.aiInfo.slaHours} hours</span>
          </div>
        </div>

        <div className="success-actions">
          <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          <button className="btn btn-saffron" onClick={() => { setSuccess(null); setStep(0); setForm({ title:'', description:'', category:'', district:'', address:'', pincode:'', lat:null, lng:null, isAnonymous:false, language:'en', voiceTranscript:'' }); setFiles([]); }}>
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-page">
      {/* Progress Steps */}
      <div className="submit-header">
        <h1 className="page-title">{t('form.title')}</h1>
        <p className="page-subtitle">{t('form.subtitle')}</p>
      </div>

      <div className="step-progress">
        {STEPS.map((s, i) => (
          <div key={i} className={`step-item-prog ${i < step ? 'done' : i === step ? 'active' : ''}`}>
            <div className="step-circle">
              {i < step ? '✓' : i + 1}
            </div>
            <span className="step-label-prog">{s}</span>
            {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
          </div>
        ))}
      </div>

      <div className="submit-card card">
        <div className="card-body">
          <AnimatePresence mode="wait">
            {/* ── Step 0: Basic Details ── */}
            {step === 0 && (
              <motion.div 
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="step-content"
              >
              {/* Language selector */}
              <div className="lang-selector">
                <button
                  type="button"
                  className={`lang-opt ${form.language === 'en' ? 'active' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, language: 'en' }))}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  className={`lang-opt ${form.language === 'ta' ? 'active' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, language: 'ta' }))}
                >
                  🇮🇳 தமிழ்
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('form.complaint_title')} <span className="required">*</span>
                </label>
                <input
                  name="title"
                  className={`form-control ${errors.title ? 'error' : ''}`}
                  placeholder={t('form.complaint_title_ph')}
                  value={form.title}
                  onChange={handleChange}
                  maxLength={200}
                />
                {errors.title && <div className="form-error">{errors.title}</div>}
                <div className="form-hint">{form.title.length}/200 characters</div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('form.description')} <span className="required">*</span>
                </label>
                <div className="desc-wrapper">
                  <textarea
                    name="description"
                    className={`form-control ${errors.description ? 'error' : ''}`}
                    placeholder={t('form.description_ph')}
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    maxLength={2000}
                  />
                  <button
                    type="button"
                    className={`voice-btn ${voiceActive ? 'recording' : ''}`}
                    onClick={voiceActive ? stopVoice : startVoice}
                    title={voiceActive ? 'Stop Listening' : t('form.voice_input')}
                  >
                    {voiceActive ? <Square size={16} /> : <Mic size={16} />}
                    <span style={{ marginLeft: '4px' }}>
                      {voiceActive ? 'Listening...' : t('form.voice_input')}
                    </span>
                    {voiceActive && <span className="voice-pulse" />}
                  </button>
                </div>
                {errors.description && <div className="form-error">{errors.description}</div>}
                <div className="form-hint">{form.description.length}/2000 characters</div>
              </div>

              {/* AI Suggestion */}
              {(aiSuggestion || aiLoading) && (
                <div className="ai-suggestion animate-fade-up">
                  <div className="ai-suggestion-header">
                    <Bot size={18} style={{marginRight: '8px'}}/> {t('form.ai_detected')}
                    {aiLoading && <div className="spinner spinner-sm" style={{ marginLeft: 'auto' }} />}
                  </div>
                  {aiSuggestion && !aiLoading && (
                    <div className="ai-suggestion-body">
                      <span className="ai-category-badge">
                        {aiSuggestion.toUpperCase()}
                      </span>
                      <span className="ai-hint">— This complaint will be auto-routed to the appropriate department.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Anonymous */}
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isAnonymous"
                    checked={form.isAnonymous}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom" />
                  {t('form.anonymous')}
                </label>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Location ── */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="step-content"
            >
              <div className="location-grid">
                <div className="form-group">
                  <label className="form-label">{t('form.location')} <span className="required">*</span></label>
                  <input
                    name="address"
                    className={`form-control ${errors.address ? 'error' : ''}`}
                    placeholder={t('form.location_ph')}
                    value={form.address}
                    onChange={handleChange}
                  />
                  {errors.address && <div className="form-error">{errors.address}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('form.district')} <span className="required">*</span></label>
                  <select
                    name="district"
                    className={`form-control ${errors.district ? 'error' : ''}`}
                    value={form.district}
                    onChange={handleChange}
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.district && <div className="form-error">{errors.district}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('form.pincode')}</label>
                  <input
                    name="pincode"
                    className="form-control"
                    placeholder="e.g. 600001"
                    value={form.pincode}
                    onChange={handleChange}
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="map-label">
                📍 Click on the map to pin the exact location <span className="form-hint">(optional)</span>
              </div>
              <div style={{ height: '350px', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '2px solid var(--gray-200)' }}>
                <MapContainer
                  center={[11.127123, 78.656891]}
                  zoom={7}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapClickHandler onLocationSelect={handleMapClick} />
                  {markerPos && <Marker position={markerPos} />}
                </MapContainer>
              </div>
              {form.lat && (
                <div className="coord-display">
                  📌 Lat: {form.lat.toFixed(5)}, Lng: {form.lng.toFixed(5)}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Step 2: Attachments ── */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="step-content"
            >
              <div className="upload-area" onClick={() => document.getElementById('file-input').click()}>
                <div className="upload-icon"><Paperclip size={32} /></div>
                <div className="upload-title">{t('form.attachments')}</div>
                <div className="upload-hint">{t('form.attachments_hint')}</div>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }}>
                  Browse Files
                </button>
              </div>

              {files.length > 0 && (
                <div className="file-list">
                  {files.map((f, i) => (
                    <div key={i} className="file-item">
                      <span>{f.type.includes('image') ? '🖼️' : '📄'}</span>
                      <div className="file-info">
                        <div className="file-name">{f.name}</div>
                        <div className="file-size">{(f.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button className="file-remove" onClick={() => removeFile(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              {files.length === 0 && (
                <div className="skip-hint">You can skip this step if no attachments are needed.</div>
              )}
            </motion.div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="step-content"
            >
              <div className="review-section">
                <h3 className="review-title"><FileText size={18} style={{marginRight:'8px', verticalAlign:'text-bottom'}} /> Review Your Complaint</h3>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="review-label">Title</span>
                    <span className="review-value">{form.title}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Language</span>
                    <span className="review-value">{form.language === 'en' ? '🇬🇧 English' : '🇮🇳 Tamil'}</span>
                  </div>
                  <div className="review-item full-width">
                    <span className="review-label">Description</span>
                    <span className="review-value">{form.description}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Location</span>
                    <span className="review-value">{form.address}, {form.district} {form.pincode}</span>
                  </div>
                  {form.lat && (
                    <div className="review-item">
                      <span className="review-label">Coordinates</span>
                      <span className="review-value">{form.lat.toFixed(5)}, {form.lng.toFixed(5)}</span>
                    </div>
                  )}
                  <div className="review-item">
                    <span className="review-label">Attachments</span>
                    <span className="review-value">{files.length > 0 ? `${files.length} file(s)` : 'None'}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Anonymous</span>
                    <span className="review-value">{form.isAnonymous ? '✅ Yes' : '❌ No'}</span>
                  </div>
                  {aiSuggestion && (
                    <div className="review-item">
                      <span className="review-label">AI Category</span>
                      <span className="review-value" style={{ textTransform: 'capitalize', fontWeight: 700, color: 'var(--navy-500)' }}>
                        🤖 {aiSuggestion}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {errors.submit && (
                <div className="error-banner"><CheckCircle2 size={16} /> {errors.submit}</div>
              )}
            </motion.div>
          )}
          </AnimatePresence>

          {/* Actions */}
          <div className="step-actions">
            {step > 0 && (
              <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft size={18} /> {t('form.back')}
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="btn btn-saffron" onClick={handleNext}>
                {t('form.next')} <ChevronRight size={18} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <><div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> {t('form.submitting')}</>
                ) : (
                  <><Send size={18} style={{marginRight:'8px'}}/> {t('form.submit_btn')}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
