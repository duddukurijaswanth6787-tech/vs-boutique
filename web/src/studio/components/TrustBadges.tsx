/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Truck, ShieldCheck, Scissors, RefreshCw, PhoneCall } from 'lucide-react';

export default function TrustBadges() {
  const items = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders above ₹999'
    },
    {
      icon: ShieldCheck,
      title: 'Secure Payment',
      description: '100% secure checkout'
    },
    {
      icon: Scissors,
      title: 'Custom Tailoring',
      description: 'Made just for you'
    },
    {
      icon: RefreshCw,
      title: 'Easy Returns',
      description: 'Hassle free returns'
    },
    {
      icon: PhoneCall,
      title: 'Support 24/7',
      description: "We're here to help"
    }
  ];

  return (
    <section className="w-full bg-white border-y border-accent/10 py-6 px-4 md:px-10" id="trust-strip">
      <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 items-center justify-around">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3 px-3 py-1.5 transition-all duration-300 group justify-center md:justify-start"
            >
              {/* Circular light gold icon container */}
              <div className="h-10 w-10 flex-shrink-0 bg-[#FDFBF7] border border-[#C5A059]/20 rounded-full flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-colors duration-300">
                <Icon className="h-4.5 w-4.5 text-accent group-hover:text-white transition-colors duration-300 stroke-[1.5]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[10px] font-bold uppercase tracking-wide text-luxury-black leading-none">{item.title}</h4>
                <p className="text-[9px] text-gray-400 mt-1 block truncate">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
