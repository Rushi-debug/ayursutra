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
    k1: 'https://lottie.host/d67ab91b-fb39-4ca8-a57c-b4fec709b85c/4ZdxaL6MAh.json',
    k5: 'https://assets7.lottiefiles.com/packages/lf20_7fCbvNSmFD.json',
    k3: 'https://lottie.host/d3323c52-e96c-4f83-8b8b-851949a31307/Dzw5aJxulk.json',
    k4: 'https://assets2.lottiefiles.com/packages/lf20_i9mxcD.json',
    k2: 'https://lottie.host/27234d60-7832-4a8b-aa9f-b0c4ca342208/CYvJ0F60Sh.json',
  };

  const steps = [
    { id: 'vamana', title: 'Vamana — Therapeutic Emesis', desc: 'A cleansing therapy to remove excess Kapha and toxins from the upper digestive tract.', anim: publicAnimations.k1 },
    { id: 'virechana', title: 'Virechana — Purgation Therapy', desc: 'A medicated purgation to cleanse Pitta-related toxins and cleanse the intestinal tract.', anim: publicAnimations.k2 },
    { id: 'basti', title: 'Basti — Medicated Enema', desc: 'A therapeutic enema using herbal oils and decoctions to balance Vata and remove deep-seated toxins.', anim: publicAnimations.k3 },
    { id: 'nasya', title: 'Nasya — Nasal Therapy', desc: 'Administration of herbal oils or powders through the nostrils to clear head-related channels and balance doshas.', anim: publicAnimations.k4 },
    { id: 'raktamokshana', title: 'Raktamokshana — Bloodletting / Purification', desc: 'An ancient cleansing technique to remove impure blood and balance certain conditions.', anim: publicAnimations.k5 },
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