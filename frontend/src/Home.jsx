import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import RemoteLottie from './components/RemoteLottie';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const sectionsRef = useRef([]);
  sectionsRef.current = [];
  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) sectionsRef.current.push(el);
  };

  useEffect(() => {
    sectionsRef.current.forEach((section) => {
      const card = section.querySelector('.card');
      gsap.set(card, { autoAlpha: 0, y: 40 });
      ScrollTrigger.create({
        trigger: section,
        start: 'top 75%',
        end: 'top 40%',
        onEnter: () => gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }),
        onLeaveBack: () => gsap.to(card, { autoAlpha: 0, y: 40, duration: 0.6, ease: 'power3.out' }),
      });

      const animWrap = section.querySelector('.animWrap');
      if (animWrap) {
        gsap.fromTo(
          animWrap,
          { y: -10 },
          {
            y: 10,
            ease: 'none',
            scrollTrigger: { trigger: section, scrub: 0.8, start: 'top bottom', end: 'bottom top' },
          }
        );
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      gsap.killTweensOf('*');
    };
  }, []);

  const publicAnimations = {
    massage1: 'https://assets7.lottiefiles.com/packages/lf20_7fCbvNSmFD.json',
    massage2: 'https://assets5.lottiefiles.com/packages/lf20_uNwwkb.json',
    calmBreath: 'https://assets.lottiefiles.com/packages/lf20_UJNc2t.json',
    healing: 'https://assets2.lottiefiles.com/packages/lf20_i9mxcD.json',
  };

  const steps = [
    { id: 'vamana', title: 'Vamana — Therapeutic Emesis', desc: 'A cleansing therapy to remove excess Kapha and toxins from the upper digestive tract.', anim: publicAnimations.calmBreath },
    { id: 'virechana', title: 'Virechana — Purgation Therapy', desc: 'A medicated purgation to cleanse Pitta-related toxins and cleanse the intestinal tract.', anim: publicAnimations.healing },
    { id: 'basti', title: 'Basti — Medicated Enema', desc: 'A therapeutic enema using herbal oils and decoctions to balance Vata and remove deep-seated toxins.', anim: publicAnimations.massage1 },
    { id: 'nasya', title: 'Nasya — Nasal Therapy', desc: 'Administration of herbal oils or powders through the nostrils to clear head-related channels and balance doshas.', anim: publicAnimations.massage2 },
    { id: 'raktamokshana', title: 'Raktamokshana — Bloodletting / Purification', desc: 'An ancient cleansing technique to remove impure blood and balance certain conditions.', anim: publicAnimations.healing },
  ];

  return (
    <div className="app">
      <main className="app-main">
        <div className="text-center mb-4">
          <h1 className="mb-1">Panchakarma — A Journey of Deep Cleansing</h1>
          <p className="text-muted">Scroll down to experience the five primary Panchakarma therapies.</p>
        </div>

        {steps.map(step => (
          <section className="section" key={step.id} ref={addToRefs} id={step.id}>
            <div className="card">
              <div className="animWrap">
                {typeof step.anim === 'string' ? <RemoteLottie url={step.anim} /> : <div className="placeholder">Visual</div>}
              </div>
              <div className="text">
                <h4>{step.title}</h4>
                <p className="text-muted">{step.desc}</p>
                <p style={{ marginTop: 8, color: '#2F4F4F', fontSize: 14 }}>Tip: Add practitioner notes and session details here.</p>
              </div>
            </div>
          </section>
        ))}
      </main>

      <footer className="text-center py-3 text-muted">Built with care — always consult an Ayurvedic practitioner.</footer>
    </div>
  );
}