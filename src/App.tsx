import { useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, Minus, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Answer = 'yes' | 'no';
type Tribe = 'IIM K' | 'PhonePe' | 'GVP' | 'Bethany' | 'Castrol' | 'Others';
type FormState = {
  guestName: string;
  guestCount: number;
  tribe: Tribe | '';
  tribeOther: string;
  fusionParty: Answer | '';
  sangeet: Answer | '';
  wedding: Answer | '';
  stayingOver: Answer | '';
  accommodation11th: Answer | '';
  accommodation12th: Answer | '';
  accommodation13th: Answer | '';
};

const initialForm: FormState = {
  guestName: '',
  guestCount: 1,
  tribe: '',
  tribeOther: '',
  fusionParty: '',
  sangeet: '',
  wedding: '',
  stayingOver: '',
  accommodation11th: '',
  accommodation12th: '',
  accommodation13th: '',
};

const venuePhotos = ['/location-venue.png', '/location-venue-1.png'];
const fusionPhotos = ['/dress-code-ref-1.jpeg', '/dress-code-ref-2.jpeg', '/dress-code-ref-3.jpeg', '/dress-code-ref-4.jpeg','/dress-code-ref-5.jpeg'];

function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const updateAnswer = (field: keyof FormState, value: Answer) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!form.tribe) { setError('Please pick your tribe.'); return; }
    if (form.tribe === 'Others' && !form.tribeOther.trim()) { setError('Please tell us your tribe.'); return; }
    if (!form.fusionParty || !form.sangeet || !form.wedding) { setError('Please confirm the events you will be attending.'); return; }
    if (!form.stayingOver) { setError('Please let us know if you need help with accommodation.'); return; }
    if (form.stayingOver === 'yes' && (!form.accommodation11th || !form.accommodation12th || !form.accommodation13th)) { setError('Please select Yes or No for each accommodation night.'); return; }
    setIsSubmitting(true);
    const { error: submitError } = await supabase.from('wedding_rsvp_responses').insert({
      guest_name: form.guestName.trim(),
      guest_count: form.guestCount,
      tribe: form.tribe,
      tribe_other: form.tribe === 'Others' ? form.tribeOther.trim() : null,
      fusion_party: form.fusionParty,
      sangeet: form.sangeet,
      wedding: form.wedding,
      staying_over: form.stayingOver,
      accommodation_11th: form.stayingOver === 'yes' ? form.accommodation11th : null,
      accommodation_12th: form.stayingOver === 'yes' ? form.accommodation12th : null,
      accommodation_13th: form.stayingOver === 'yes' ? form.accommodation13th : null,
    });
    if (submitError) { setError('We could not save your response. Please try again.'); setIsSubmitting(false); return; }
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <main className="invite-shell">
      <div className="blurred-backdrop" />
      <article className="invite-page">
        <section className="hero-section" id="top">
          <div className="hero-overlay" />
          <header className="hero-meta"><span>Our wedding</span><span>#TUTTUPALLA</span></header>
          <div className="hero-center">
            <img className="hero-logo" src="/Gold-text-no-bg.svg" alt="Sharani and Aravind monogram" />
            <p className="light-kicker">Together with our families</p>
            <h1>Sharani <i>&amp;</i> Aravind</h1>
            <p className="hero-date">Saturday &amp; Sunday, 12–13 December 2026</p>
          </div>
          <button className="hero-scroll" onClick={() => scrollTo('rsvp')} aria-label="Go to RSVP form"><span>RSVP</span><ArrowDown size={16} /></button>
        </section>

        <section className="invite-section welcome-section" id="welcome">
          <h2>Dear friends<br />and family,</h2>
          <p className="welcome-body">We fell in love.<br />We said yes.<br />And now we're throwing a party about it.</p>
          <p className="welcome-body">Come celebrate the start of our next chapter with us — surrounded by the people who make life a little more wonderful, a lot more fun, and occasionally much more chaotic.</p>
          <p className="welcome-body">We can't imagine doing this without you.</p>
          {/*<button className="round-arrow" onClick={() => scrollTo('program')} aria-label="Continue"><ArrowDown size={16} /></button>*/}
        </section>

        <section className="invite-section save-section">
          <div className="save-copy"><p className="kicker">Save the dates</p><h2>12<br /><i>&amp; 13</i><br />2026</h2><p>December<br />Two days made for us</p></div>
          <p className="section-note">We may not have all the answers,<br />but we know we want you there.</p>
        </section>

        <section className="invite-section location-section">
          <div className="location-heading"><p className="kicker">Location</p><h2>Sai Priya<br /><i>Beach Resort</i></h2></div>
          <PhotoCarousel className="location-carousel" photos={venuePhotos} alt="Sai Priya Beach Resort" />
          <p>We'll be celebrating by the beach at Sai Priya Beach Resort, Visakhapatnam.</p>
          <a className="pill-button" href="https://maps.app.goo.gl/id42pd1ZgCsBTgb98" target="_blank" rel="noreferrer">View the map <ArrowRight size={13} /></a>
        </section>

        <section className="invite-section program-section" id="program">
          <p className="kicker">The celebration</p>
          <h2>Our two<br /><i>days together</i></h2>
          <div className="timeline">
            <TimelineItem icon="◷" time="Dec 12 · 10:30 AM" title="Fusion Party" />
            <TimelineItem icon="♢" time="Dec 12 · 6:00 PM" title="Sangeet" />
            <TimelineItem icon="♧" time="Dec 13 · 7:00 PM" title="Wedding" last />
          </div>
        </section>

        <section className="invite-section dress-section">
          <p className="kicker">A little guidance</p>
          <h2>Dress <i>code</i></h2>

          <div className="dress-block dress-event dress-fusion">
            <p className="dress-emoji-title">🌸 FUSION PARTY</p>
            <p className="dress-sub">Pastels, pretty things &amp; a little bit of South Indian drama</p>
            <p>We're going for pastels + light colours + Indian silhouettes.</p>
            <p><strong>Think:</strong> Kerala kasavu sarees, Kalamkari blouses, Gadwal sarees, Mangalgiri/Mangalagiri sarees, light cotton/silk sarees, pastel kurtas / anarkalis, Kerala mundu or pattu pancha.</p>
            <p>Basically anything that says "I made an effort" without saying "I haven't sat down in three hours."</p>
            <p className="dress-muted">Colour mood: ivory • cream • blush • peach • sage • powder blue • lilac • butter yellow • soft pink</p>
          </div>

          <PhotoCarousel className="dress-carousel" photos={fusionPhotos} alt="Fusion Party outfit inspiration" />

          <div className="dress-block dress-psa">
            <p className="dress-emoji-title">🌿 A VERY IMPORTANT PUBLIC SERVICE ANNOUNCEMENT</p>
            <p>This party is outdoors. On grass.<br />So please consider:</p>
            <p><strong>☀️ SUNSCREEN</strong><br />Because "I forgot" is not a skincare routine.</p>
            <p><strong>🕶️ SHADES</strong><br />Cute + functional. We support both.</p>
            <p><strong>👡 GRASS-FRIENDLY FOOTWEAR</strong><br />Block heels, wedges, juttis, flats, shoes, sneakers — anything that won't have you performing an impromptu "heel stuck in the lawn" dance.</p>
          </div>

          <div className="dress-block dress-event dress-sangeet">
            <p className="dress-emoji-title">🌙 SANGEET</p>
            <p className="dress-sub">Night time. Beach breeze. Main character energy.</p>
            <p>Go dressy, dancey &amp; comfortable enough to actually dance.</p>
            <p><strong>Think:</strong> Flowing sarees, Lehengas, Sharara sets, Indo-western fits, Dressy co-ords, Statement blouses, Sequins / shimmer / metallic details, Jewel tones, deeper pastels &amp; evening colours</p>
          </div>

          <div className="dress-block dress-psa">
            <p className="dress-emoji-title">👟 FOOTWEAR CHECK</p>
            <p>The dance floor is grass. The beach is nearby. Your feet have rights.<br />So please choose wisely.</p>
            <p><strong>YES:</strong> Block heels • wedges • embellished flats • juttis • dressy sandals • Shoes • Sneakers</p>
          </div>

          <div className="dress-block dress-closing">
            <p className="dress-emoji-title">No rules. Just vibes.</p>
            <p>We have suggestions. You have free will.<br />Please dress accordingly. Or don't. We're getting married either way.</p>
            <p className="dress-muted">MAYBE: Stilettos, if you enjoy living dangerously.</p>
          </div>
        </section>

        <section className="invite-section rsvp-section" id="rsvp">
          <p className="kicker">Kindly reply</p>
          <h2>Attendance &<br /><i>Roomie Matchmaking</i><br />Department</h2>
          <p className="section-note">Your answers will help us prepare a beautiful day for everyone — and find you the perfect roomie.</p>
          {submitted ? <div className="success-state"><span><Check size={18} /></span><h3>Thank you.</h3><p>Your response has been saved. We cannot wait to celebrate with you.</p></div> : <form onSubmit={handleSubmit}>
            <div>
              <label className="field-label" htmlFor="guestName">Q1 · Your name</label>
              <input id="guestName" value={form.guestName} onChange={(event) => setForm({ ...form, guestName: event.target.value })} placeholder="Write your name" required maxLength={120} />
            </div>

            <div className="count-line"><span className="field-label">Q2 · Number of guests</span><div className="counter"><button type="button" onClick={() => setForm({ ...form, guestCount: Math.max(1, form.guestCount - 1) })} aria-label="Decrease guests"><Minus size={13} /></button><span>{form.guestCount}</span><button type="button" onClick={() => setForm({ ...form, guestCount: Math.min(10, form.guestCount + 1) })} aria-label="Increase guests"><Plus size={13} /></button></div></div>

            <fieldset className="answer-field">
              <legend>Q3 · Which gang are you from?</legend>
              <p className="field-hint">This is very important scientific research that will help us find you a relevant roomie. Pick your tribe:</p>
              <div className="tribe-options">
                {(['IIM K', 'PhonePe', 'GVP', 'Bethany', 'Castrol', 'Others'] as Tribe[]).map((t) => (
                  <label key={t} className={form.tribe === t ? 'selected' : ''}>
                    <input type="radio" name="tribe" checked={form.tribe === t} onChange={() => setForm({ ...form, tribe: t, tribeOther: '' })} />
                    {t}
                  </label>
                ))}
              </div>
              {form.tribe === 'Others' && <input className="tribe-other-input" value={form.tribeOther} onChange={(event) => setForm({ ...form, tribeOther: event.target.value })} placeholder="Tell us your tribe" maxLength={80} />}
            </fieldset>

            <fieldset className="answer-field">
              <legend>Q4 · Please confirm the events you would be attending</legend>
              <AnswerField label="Fusion Party" value={form.fusionParty} onChange={(value) => updateAnswer('fusionParty', value)} />
              <AnswerField label="Sangeet" value={form.sangeet} onChange={(value) => updateAnswer('sangeet', value)} />
              <AnswerField label="Wedding" value={form.wedding} onChange={(value) => updateAnswer('wedding', value)} />
            </fieldset>

            <fieldset className="answer-field">
              <legend>Q5 · Would you need help with accommodation?</legend>
              <div className="radio-options">
                <label className={form.stayingOver === 'yes' ? 'selected' : ''}><input type="radio" name="stayingOver" checked={form.stayingOver === 'yes'} onChange={() => updateAnswer('stayingOver', 'yes')} /> Yes</label>
                <label className={form.stayingOver === 'no' ? 'selected' : ''}><input type="radio" name="stayingOver" checked={form.stayingOver === 'no'} onChange={() => updateAnswer('stayingOver', 'no')} /> No</label>
              </div>
              {form.stayingOver === 'yes' && <div className="accommodation-nights">
                <AnswerField label="11th night" value={form.accommodation11th} onChange={(value) => updateAnswer('accommodation11th', value)} />
                <AnswerField label="12th night" value={form.accommodation12th} onChange={(value) => updateAnswer('accommodation12th', value)} />
                <AnswerField label="13th night" value={form.accommodation13th} onChange={(value) => updateAnswer('accommodation13th', value)} />
              </div>}
            </fieldset>

            {error && <p className="form-error">{error}</p>}
            <button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send response'} <ArrowRight size={15} /></button>
          </form>}
        </section>

        <section className="invite-section closing-section">
          <p className="kicker">A little note from us</p>
          <h2>Dear<br /><i>guests,</i></h2>
          <p>We hope this day will be full of happiness, laughter, and memories we can carry with us forever. Thank you for being part of our story.</p>
          <div className="champagne-image" />
          <p>We cannot wait to celebrate every little moment with you.</p>
          <br/>
          <p className="kicker">#TUTTUPALLA</p>
        </section>

        <footer className="invite-footer"><span>12—13 December 2026</span></footer>
      </article>
    </main>
  );
}

function TimelineItem({ icon, time, title, last = false }: { icon: string; time: string; title: string; last?: boolean }) { return <div className={`timeline-item ${last ? 'last' : ''}`}><span className="timeline-icon">{icon}</span><div><strong>{time}</strong><span>{title}</span></div></div>; }
function AnswerField({ label, value, onChange }: { label: string; value: Answer | ''; onChange: (value: Answer) => void }) { return <fieldset className="answer-field answer-sub"><legend>{label}</legend><div className="radio-options"><label className={value === 'yes' ? 'selected' : ''}><input type="radio" name={label} checked={value === 'yes'} onChange={() => onChange('yes')} /> Yes</label><label className={value === 'no' ? 'selected' : ''}><input type="radio" name={label} checked={value === 'no'} onChange={() => onChange('no')} /> No</label></div></fieldset>; }

function PhotoCarousel({ photos, alt, className = '' }: { photos: string[]; alt: string; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const goToSlide = (index: number) => {
    const nextSlide = (index + photos.length) % photos.length;
    trackRef.current?.children[nextSlide]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setActiveSlide(nextSlide);
  };

  const updateActiveSlide = () => {
    const track = trackRef.current;
    if (!track) return;
    setActiveSlide(Math.round(track.scrollLeft / track.clientWidth));
  };

  return <div className={`venue-carousel ${className}`} aria-roledescription="carousel" aria-label={alt}>
    <div className="venue-track" ref={trackRef} onScroll={updateActiveSlide}>
      {photos.map((src, index) => <img key={src} src={src} alt={`${alt}, photo ${index + 1} of ${photos.length}`} className="venue-img" />)}
    </div>
    {photos.length > 1 && <>
      <button className="carousel-arrow carousel-arrow-prev" type="button" onClick={() => goToSlide(activeSlide - 1)} aria-label="Previous photo"><ArrowLeft size={16} /></button>
      <button className="carousel-arrow carousel-arrow-next" type="button" onClick={() => goToSlide(activeSlide + 1)} aria-label="Next photo"><ArrowRight size={16} /></button>
      <div className="carousel-dots" aria-label={`Photo ${activeSlide + 1} of ${photos.length}`}>
        {photos.map((src, index) => <button key={src} type="button" className={index === activeSlide ? 'active' : ''} onClick={() => goToSlide(index)} aria-label={`Show photo ${index + 1}`} aria-current={index === activeSlide ? 'true' : undefined} />)}
      </div>
    </>}
  </div>;
}
export default App;
