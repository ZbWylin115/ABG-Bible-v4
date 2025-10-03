export function buildContext(opts, arch, ven, plat, cityPack, eth){
  const noise=({
    club:'loud', festival:'loud', karaoke:'loud', rooftop_bar:'medium',
    cafe:'quiet', boba:'quiet', dinner:'quiet', art_walk:'medium',
    mall_arcade:'medium', chill_in:'quiet', car_meet:'medium',
    museum:'quiet', late_food:'medium'
  }[ven?.id]) || (opts.channel==='Virtual' ? 'quiet' : 'medium');

  const flow=({
    club:'dance', festival:'walk', karaoke:'seated', rooftop_bar:'seated',
    cafe:'seated', boba:'walk', dinner:'seated', art_walk:'walk',
    mall_arcade:'walk', chill_in:'seated', car_meet:'walk',
    museum:'walk', late_food:'seated'
  }[ven?.id]) || 'walk';

  const sceneLine = opts.channel==='Virtual'
    ? `${plat?.label}: short, specific, playful; reference her content.`
    : `${ven?.scene_setup || 'Match the room'} Tone: ${arch?.tone.energy}/${arch?.tone.pace}.`;

  const doList = (opts.channel==='Virtual')
    ? ['Be specific to her content','Use platform norms (voice/pics where normal)','Offer 2 clear time windows']
    : [...(ven?.do||[]), ...(arch?.safe_topics?['Hit topics: '+arch.safe_topics.slice(0,3).join(', ')] : [])];

  const dontList = (opts.channel==='Virtual')
    ? ['Don’t spam paragraphs','Don’t hard-push IRL without green signals']
    : [...(ven?.dont||[]), ...(arch?.pitfalls||[]).slice(0,1)];

  const cityNote = makeCityNote(cityPack);
  const ethNote = opts.includeEth && eth ? `${eth.blurb} Easy pivot: ${eth.pivot}. Avoid: ${eth.pitfall}.` : '';

  const why = [
    `Picked because: ${opts.channel==='IRL' ? `${ven?.label||'Venue'} ${noise}/${flow}` : plat?.label||'Platform'}; goal=${opts.goal}; interest=${opts.interest}; party=${opts.party}.`,
    (noise==='loud'?'Loud room → action over long talk.':null),
    (opts.party==='crew'?'Her crew present → choose games/pivots.':null)
  ].filter(Boolean).join(' ');

  return {
    channel: opts.channel, time: opts.time, interest: opts.interest, edgy: opts.edgy,
    mode: opts.mode, goal: opts.goal, party: opts.party || 'solo',
    tone: opts.tone || 'flirty',
    venueType: ven?.id, noise, flow,
    archetypeEnergy: arch?.tone?.energy || 'calm',
    sceneLine, doList, dontList, cityNote, ethNote, why,
    liveSignal: null,
    opts
  };
}

function makeCityNote(pack){
  if(!pack) return '';
  const s = pickOne(pack.main); const a = pickOne(pack.alt);
  return `Try ${s?.name}${s?' — '+s.desc:''}. Alt: ${a?.name}.`;
}
function pickOne(arr){ return arr?.[Math.floor(Math.random()*arr.length)] || null; }
