/* ============================================================
   Coach Messages — All variant pools for Bloom Coach
   ============================================================ */

export function buildCoachPool(store) {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const name      = store.state.profile?.name || 'there';
  const allFasts  = store.state.fasts;
  const completed = allFasts.filter(f => f.completed);
  const recentMetrics = store.state.metrics.slice(-7);
  const recentJournal = store.state.journal.slice(0, 5);
  const streak    = store.state.streakCount || 0;
  const weights   = store.state.weight;
  const hour      = new Date().getHours();
  const pool      = [];

  // ================================================================
  //  STREAK
  // ================================================================
  if (streak >= 30) {
    pool.push(pick([
      { title: '🌸 30-Day Legend',       text: `${streak} days straight, ${name}. That's not discipline anymore — that's identity. You've crossed the threshold where fasting isn't something you do, it's who you are.` },
      { title: '🏆 Month-Long Mastery',  text: `${streak} consecutive days, ${name}. Most people quit in week one. You're operating in a league most people never enter.` },
      { title: '🌺 Unbreakable Root',    text: `A ${streak}-day streak is extraordinary. Your metabolism has fully adapted. Your body now expects this rhythm and rewards you every single day.` },
      { title: '🌳 30 Days of Proof',    text: `${streak} days in a row, ${name}. At this point your fasting habit has more staying power than most gym memberships and diet plans combined.` },
      { title: '🧬 Transformed Biology', text: `Thirty-plus days is where the science gets remarkable, ${name}. Your microbiome has shifted, your insulin sensitivity has measurably improved, and your relationship with food has fundamentally changed.` },
      { title: '🌿 New Default',         text: `${streak} days in a row — your body is no longer adapting to fasting. It has adapted. This is your new baseline.` },
      { title: '🌸 The Question Settled',text: `${name}, a ${streak}-day streak means you've proven something most people only theorize about. The willpower question is long settled.` },
      { title: '🌺 Self-Reinforcing',    text: `${streak} consecutive fasts. The people who get here tend to stay here, ${name}. The habit is self-reinforcing at this level.` },
      { title: '🗳️ Votes Cast',          text: `Every day of a ${streak}-day streak is a vote for the person you want to be, ${name}. You've cast ${streak} votes in a row.` },
      { title: '🔬 Measurable Change',   text: `${streak} days straight. Long-term fasters show compounding improvements in cognitive function, inflammation markers, and metabolic health — you're past the point where those improvements plateau.` },
      { title: '🌱 Hunger Silenced',     text: `${name}, you've fasted ${streak} straight days. The hunger that plagued the early days is barely a whisper now. That's your biology changing, not just your willpower.` },
      { title: '🤝 Working Together',    text: `At ${streak} days, you're no longer fighting your body — you're working with it. Fasting has become your body's preferred operating state.` },
      { title: '🔄 Default Rewired',     text: `${streak} days, ${name}. You didn't just build a habit. You rewired your default. That's harder than anything a wellness article can describe.` },
      { title: '✅ The Real You',        text: `A ${streak}-day streak is proof that the version of you who said 'I can't fast' was simply wrong. This is the real you.` },
      { title: '🌙 New Metabolic Person',text: `${streak} consecutive days, ${name}. Your cortisol rhythms, hunger hormones, and sleep architecture have all reorganized around your fasting window. You're a different metabolic person than you were a month ago.` },
      { title: '🏡 The Garden Knows',    text: `${streak} days and your garden reflects it, ${name}. Every bloom represents a day you showed up — that's a record nothing can take away.` },
      { title: '🌊 Past the Hard Part',  text: `After ${streak} days, ${name}, the hard psychological battle is over. Fasting is now a background process your brain runs without much deliberate effort.` },
      { title: '⏳ Compound Effect',     text: `${streak} days of fasting is ${Math.round(streak * 0.67)} days worth of ketosis, ${Math.round(streak * 8)} hours of elevated growth hormone, and ${streak} daily doses of autophagy. It adds up.` },
      { title: '🌿 True Practitioner',   text: `${name}, most people who say they fast quit before 10 days. At ${streak} days you're not a beginner or a dabbler — you're a practitioner.` },
      { title: '🌸 Rare Territory',      text: `${streak} days in a row is rare territory, ${name}. There's a small percentage of people worldwide fasting at this consistency. You're among them.` },
    ]));
  } else if (streak >= 14) {
    pool.push(pick([
      { title: '🌿 Two Weeks Strong',    text: `${streak} days in a row, ${name}. Two weeks is where fasting shifts from effort to ease. Your hunger hormones are recalibrating around your new rhythm.` },
      { title: '🌼 Streak Momentum',     text: `${name}, ${streak} days of commitment. The compound interest of consistency is quietly accumulating — in your cells, your habits, and your garden.` },
      { title: '🌳 Deep Roots',          text: `${streak}-day streak. At this point your body has adapted its circadian rhythm to your fasting window. You're likely sleeping better and thinking clearer — even if you haven't fully noticed yet.` },
      { title: '🔥 Fat Adapted',         text: `At ${streak} days, ${name}, your body is genuinely fat-adapted. The metabolic machinery to burn stored fat efficiently is built and running.` },
      { title: '🌸 Hormones Adjusted',   text: `${streak} days in, ${name}. Ghrelin peaks — your main hunger signal — have shifted to align with your eating window. That morning hunger you used to feel at 7am? It's moved.` },
      { title: '🌿 Effortless Mode',     text: `${streak} days. What took willpower on day one is starting to feel automatic now, ${name}. That's the biology of habit formation working exactly as designed.` },
      { title: '🌻 Compounding Hard',    text: `Two weeks of fasting, ${name}. Every day from here is compounding the gains of every day before it. This is how transformation actually happens.` },
      { title: '🧠 Cognition Sharpened', text: `Around ${streak} days in, most consistent fasters report a noticeable improvement in mental clarity and focus, ${name}. If you haven't noticed it, pay attention this week.` },
      { title: '🌱 Window Is Yours',     text: `${streak} days, ${name}. Your fasting window belongs to you now — it's defended territory in your schedule, not an open question each morning.` },
      { title: '🌺 Streak Momentum',     text: `At ${streak} days the streak itself becomes motivating, ${name}. You've built something worth protecting. That's a force multiplier that early fasters don't have.` },
      { title: '🌙 Sleep Reward',        text: `${streak} days in, ${name}. One of the most underrated benefits at this stage — your sleep architecture is likely improving as blood sugar stabilizes overnight.` },
      { title: '🌊 Tide Has Turned',     text: `${streak} days, ${name}. The first week was fighting the current. Now you are the current. Keep flowing.` },
      { title: '🌿 Inflammation Down',   text: `Two weeks of consistent fasting reduces systemic inflammation markers measurably, ${name}. If joints feel looser or skin looks clearer, that's not coincidence.` },
      { title: '🏡 Building Something', text: `${streak} days, ${name}. Not everyone sticks around long enough to see a fasting practice become genuinely easy. You're starting to see it.` },
      { title: '🌸 Real Practitioner',   text: `${streak}-day streak, ${name}. Two weeks separates the people who tried fasting from the people who do it. You're firmly in the second group now.` },
    ]));
  } else if (streak >= 7) {
    pool.push(pick([
      { title: '🌺 7-Day Bloomer',       text: `${name}, you've fasted ${streak} days in a row. At this level your body is deep into metabolic flexibility. You're building something lasting.` },
      { title: '🌿 One Full Week',        text: `Seven days straight. The first week is the hardest and you made it, ${name}. The second week is where fat adaptation kicks in fully — keep going.` },
      { title: '🌻 Weekly Warrior',       text: `${streak} days and counting, ${name}. Hunger is quieter now than it was on day one. That's ghrelin adapting to your schedule — a measurable, biological victory.` },
      { title: '🔬 Biology Shifting',    text: `At ${streak} days, ${name}, your liver glycogen is no longer the first thing your body reaches for. Fat oxidation is becoming a trained habit, not a last resort.` },
      { title: '🌱 Habit Locking In',    text: `One week in, ${name}. Research suggests 7 consecutive days is the point where a behavior begins solidifying as a habit in the brain's reward circuitry. You're right there.` },
      { title: '🌸 The Hardest Part',    text: `${streak} days, ${name}. Days 1-4 are the hardest of any fasting streak. You're past them. Most people who make it to day 7 make it to day 30. That's you.` },
      { title: '⚡ Ketone Lift',         text: `${streak} days in, ${name}. Consistent ketone production is likely giving you that mid-afternoon mental clarity you may be noticing. Don't take it for granted — protect this window.` },
      { title: '🌊 First Wave Done',     text: `One week, ${name}. The first wave of adaptation is complete. Energy might have dipped around day 3-4 — that dip is behind you now.` },
      { title: '🌿 Hunger Quieting',     text: `${streak} days. You're past the phase where hunger is loud and urgent, ${name}. It's becoming a background hum that's easy to ignore. That shift is permanent.` },
      { title: '🌺 Showed Up Daily',     text: `Seven or more days of showing up every single day, ${name}. That's a record nobody can argue with. The body remembers consistency.` },
      { title: '🌳 Roots Down',          text: `${streak} days, ${name}. Something that only gets easier from here has just taken root. The hard psychological establishment phase is largely behind you.` },
      { title: '🧬 SIRT1 Activated',    text: `After 7+ days of consistent fasting, ${name}, your SIRT1 longevity genes are reliably activating during each fasting window. You're doing anti-aging work.` },
      { title: '🌙 Sleep Improving',     text: `${streak} days, ${name}. If you haven't already, you may start noticing deeper, more restful sleep. Stabilizing your meal timing is one of the most powerful sleep interventions available.` },
      { title: '🌸 Week One Champion',   text: `Week one is done, ${name}. One of the best things about reaching 7 days is that the question 'can I do this?' has been answered with seven consecutive yeses.` },
      { title: '🌿 Pattern Established', text: `${streak} days in, ${name}. Seven days of the same behavior starts training your autonomic nervous system to run the routine without requiring conscious decision-making.` },
    ]));
  } else if (streak >= 3) {
    pool.push(pick([
      { title: '🌱 Growing Streak',      text: `${streak} days in a row, ${name}. Consistency is your superpower right now — keep nurturing it like a seedling that needs daily sunlight.` },
      { title: '🌿 Habit Forming',       text: `Three or more days in a row means your body is starting to anticipate the fasting window. The discomfort drops significantly from here, ${name}.` },
      { title: '🌸 Streak Seedling',     text: `${streak} days! The hardest streaks to build are the short ones — everyone quits before day five. You're not everyone.` },
      { title: '🔄 Neural Pattern',      text: `${streak} days in a row, ${name}. Your brain is beginning to build the neural pathway that makes fasting automatic. Every day right now does extra work.` },
      { title: '🌺 Early Momentum',      text: `${streak} consecutive days, ${name}. Early-streak momentum is the rarest and most valuable kind. Don't break it — it costs twice as much to rebuild.` },
      { title: '🌱 Past the Quit Zone',  text: `${streak} days in, ${name}. Most people who quit, quit before day three. You're past that zone. The gravitational pull toward consistency is starting to work in your favor.` },
      { title: '🌿 Hunger Adapting',     text: `${streak} days and you're already noticing your body adapting, ${name}. Ghrelin peaks are shifting — by day 7, hunger will be noticeably easier to manage.` },
      { title: '🌻 Snowball Starting',   text: `${streak} days, ${name}. Streaks are like snowballs — hard to start, but they gather momentum fast. You've got it rolling.` },
      { title: '🌸 Small But Real',      text: `${streak} days, ${name}. Small streaks feel fragile but they're not — they're the foundation everything else gets built on. Protect this one.` },
      { title: '🌊 First Steps Count',   text: `${streak} in a row, ${name}. Your first few days of consistency are the most metabolically significant — your liver is clearing glycogen stores and opening the door to fat burning.` },
      { title: '🌿 Getting There',       text: `${streak} days, ${name}. You're in the phase where it still takes conscious effort. That effort is worth more right now than it will be at 30 days — you're doing the hard installation work.` },
      { title: '🌱 Building Evidence',   text: `${streak} days. Each one is a data point that says: you can do this, ${name}. Let that evidence accumulate.` },
    ]));
  } else if (streak === 1) {
    pool.push(pick([
      { title: '🌱 First Step',          text: `You started today, ${name}. Every garden begins with a single seed. Show up again tomorrow and a streak begins.` },
      { title: '🌱 Day One Energy',      text: `Today counts, ${name}. Showing up on day one is where most people fail. You already did the hard part — now just do it again tomorrow.` },
      { title: '🌿 The Seed Is Planted', text: `One day in. The journey to a thriving garden starts exactly like this — a single choice, repeated. Same time tomorrow, ${name}.` },
      { title: '🌸 One Is Enough',       text: `One day. That's all any streak is on its first day, ${name}. Don't make it complicated — just do the same thing tomorrow.` },
      { title: '🌱 Beginning Counts',    text: `Day one complete, ${name}. The beginning is the most important part of any practice. You've already done the hardest thing: starting.` },
      { title: '🌿 Write Day Two',       text: `One day done, ${name}. Write 'fast tomorrow' in your phone right now. The hardest streaks to break are the ones you've publicly committed to — even to yourself.` },
      { title: '🌺 Tomorrow Matters',    text: `Today was day one, ${name}. Every 30-day streak in history started with a day one. Tomorrow is where the streak either lives or dies — show up.` },
      { title: '🌱 First Domino',        text: `You tipped the first domino, ${name}. Every great streak is one domino after another. Tomorrow is just the next one.` },
    ]));
  }

  // ================================================================
  //  COMPLETED FASTS COUNT
  // ================================================================
  if (completed.length > 0) {
    const avgMs = completed.reduce((s, f) => s + (f.actualMs || 0), 0) / completed.length;
    const avgH  = Math.round(avgMs / 3600000 * 10) / 10;
    const totalH = Math.round(completed.reduce((s, f) => s + (f.actualMs || 0), 0) / 3600000);

    if (completed.length >= 50) {
      pool.push(pick([
        { title: '🌳 50 Fasts Complete',  text: `${completed.length} completed fasts, ${name}. ${totalH} total hours of fasting. That's a profound, measurable investment in your longevity.` },
        { title: '🏆 Elite Faster',       text: `${completed.length} fasts averaging ${avgH}h. You're in the top percentile of people who commit to this lifestyle — your body knows it.` },
        { title: '🌺 Master of the Window', text: `Fifty fasts, ${name}. Your circadian biology has been reshaped. Long-term fasters show measurable improvements in insulin sensitivity, inflammation, and cognition that are hard to replicate any other way.` },
        { title: '🌸 ${completed.length} Acts of Will', text: `${completed.length} times you chose to finish, ${name}. ${completed.length} times the discomfort came and you let it pass. That's not a stat — that's character.` },
        { title: '🌿 Well Seasoned',      text: `${completed.length} fasts in, ${name}. At this volume you know things about your body — hunger timing, energy patterns, peak focus hours — that most people never discover.` },
        { title: '🌻 Lifetime Investment',text: `${totalH} total fasting hours, ${name}. Each of those hours was time your body spent repairing, autophagy-clearing, and fat-adapting. You've invested well.` },
        { title: '🧬 Adapted Body',       text: `${completed.length} completed fasts means your mitochondria, liver, gut bacteria, and hunger hormones have all been retrained around your fasting practice, ${name}. You're a different physiology than when you started.` },
        { title: '🌳 Legacy Builder',     text: `${completed.length} fasts completed. The health habits you're building now have a 20-year payoff horizon, ${name}. You're planting trees you'll absolutely live to sit under.` },
        { title: '🌸 Proof Collected',    text: `${completed.length} completed fasts is ${completed.length} pieces of evidence that you're someone who follows through, ${name}. That identity is worth more than any single result.` },
        { title: '🌺 Your Own Expert',    text: `After ${completed.length} fasts you've run more experiments on your own body than most people ever will, ${name}. Trust what you've learned.` },
      ]));
    } else if (completed.length >= 25) {
      pool.push(pick([
        { title: '🌸 25 Blooms Earned',   text: `${completed.length} complete fasts averaging ${avgH}h. You're no longer a beginner — you have a real fasting practice, ${name}.` },
        { title: '🌿 Quarter Century',    text: `25+ fasts in the books. At this volume, fat adaptation is complete. Your body runs clean on ketones and your mental clarity during fasting is near its peak.` },
        { title: '🌻 Milestone Grower',   text: `${completed.length} fasts, ${name}. The discipline you've built is constructing a metabolic engine that will serve you for decades.` },
        { title: '🌺 Pattern Locked',     text: `${completed.length} fasts, ${name}. At this point your fasting habit is more established than most people's daily vitamins. The pattern is locked.` },
        { title: '⏱️ ${totalH} Hours',    text: `${totalH} total hours of fasting, ${name}. Each one a little different, each one adding to the biological adaptation you've built.` },
        { title: '🌳 Strong Foundation',  text: `${completed.length} completed fasts is a foundation, ${name}. Everything you build on top of it — longer windows, cleaner eating, better sleep — compounds from here.` },
        { title: '🌸 Earned Knowledge',   text: `${completed.length} fasts means you know your body, ${name}. You know your hunger patterns, your best fasting hours, the signals that mean stop vs. the ones that mean push through.` },
        { title: '🌊 Deep Water',         text: `${completed.length} fasts in, ${name}. You're swimming in deep water now — comfortably. Most people are still standing on the shore.` },
      ]));
    } else if (completed.length >= 10) {
      pool.push(pick([
        { title: '🌳 Root System Strong', text: `${completed.length} completed fasts — you're no longer experimenting, you're practicing. Your average is ${avgH}h, a solid foundation for deep metabolic health.` },
        { title: '🌿 Double Digits',      text: `Ten or more fasts completed, ${name}. People who reach 10 are dramatically more likely to make this a permanent lifestyle.` },
        { title: '🌼 Established Practice', text: `${completed.length} fasts averaging ${avgH}h. You've moved from trying fasting to doing fasting. That identity shift is more powerful than any tip.` },
        { title: '🌺 Past the Learning Curve', text: `${completed.length} fasts in, ${name}. You've moved through the learning curve — the nausea, the headaches, the mid-window walls. You know what you're doing now.` },
        { title: '🌸 Compounding Starts Here', text: `${completed.length} fasts. The compounding benefits of consistent fasting — improved insulin sensitivity, better sleep, increased autophagy — accumulate most noticeably between fasts 10 and 30, ${name}.` },
        { title: '🌿 Meaningful Number',  text: `${completed.length} completed fasts is a meaningful number, ${name}. It means you've faced the hard moments — the cravings, the doubt, the social pressure — and chosen the fast ${completed.length} times.` },
        { title: '🌱 Adaptation Complete',text: `At ${completed.length} fasts, ${name}, the cellular adaptation to fasting is largely complete. Your body has built the enzymatic machinery to burn fat efficiently. That's permanent progress.` },
        { title: '🌳 10 Times Right',     text: `Ten or more times you showed up for your fasting window, ${name}. Ten or more times you proved you're the kind of person who does this. That reputation with yourself matters.` },
        { title: '🌻 Middle Miles',       text: `${completed.length} fasts, ${name}. You're in the middle miles — past the beginner excitement, before the veteran ease. This is where real character gets built. Push through.` },
      ]));
    } else if (completed.length >= 3) {
      pool.push(pick([
        { title: '🌿 Pattern Forming',    text: `${completed.length} fasts completed with an average of ${avgH}h. The habit loop is taking shape — your body is learning to expect and adapt to fasting windows.` },
        { title: '🌱 Seeds Taking Root',  text: `${completed.length} down, ${name}. You're past the point where most people give up. Your hunger patterns are already shifting in your favor.` },
        { title: '🌸 Early Bloomer',      text: `${completed.length} fasts in — you're building real evidence about what works for your body. Pay attention to how you feel at hour 12 vs hour 16. That data is yours alone.` },
        { title: '🌺 Repeating the Win',  text: `${completed.length} completed fasts means you've already proven ${completed.length} times that you can do this, ${name}. The question now is just how many more times you'll prove it.` },
        { title: '🌿 Building a Record',  text: `${completed.length} fasts in the books, ${name}. Each one is a vote. Keep voting for the person you're becoming.` },
        { title: '🌻 Early Days',         text: `${completed.length} fasts, ${name}. You're still in the early days — and the early days are where the most dramatic biological adaptations happen. Pay attention to how you feel. It's changing fast.` },
        { title: '🌱 Habit Installing',   text: `${completed.length} fasts completed. Your brain is literally rewiring right now, ${name} — building the neural circuits that will make this feel automatic in another few weeks.` },
      ]));
    } else if (completed.length === 1) {
      pool.push(pick([
        { title: '🌱 First Bloom',        text: `Your first completed fast is in the books, ${name}. That's not a small thing. The first one teaches your body what's possible. Now it gets easier.` },
        { title: '🌿 The First Is the Hardest', text: `One complete fast done. Your body now has proof it can do this. Next time the hunger wave hits, remember how it felt when it passed.` },
        { title: '🌸 Proof of Concept',   text: `Fast #1 complete, ${name}. You've run the experiment and it worked. Now run it again.` },
        { title: '🌱 One Down',           text: `One completed fast, ${name}. The most important one — the one that proves you actually can. Keep going.` },
      ]));
    }
  }

  // ================================================================
  //  COMPLETION RATE
  // ================================================================
  const rate = completed.length > 0 ? Math.round((completed.length / (allFasts.length || 1)) * 100) : null;
  if (rate !== null && allFasts.length >= 3) {
    if (rate < 60) {
      pool.push(pick([
        { title: '🌻 Early Endings',      text: `About ${100 - rate}% of your fasts end early. Observe what time of day cravings hit hardest and try shifting your eating window to protect those hours.` },
        { title: '🌿 Finishing Strong',   text: `Your completion rate is ${rate}%, ${name}. When you feel the urge to quit, try a large glass of water and 10 minutes of movement — cravings pass in under 15 minutes.` },
        { title: '💧 The Wall',           text: `Most early endings happen in the same hour window. Track when yours happen — that's where you need a strategy, not willpower.` },
        { title: '🌱 One More Hour',      text: `${rate}% completion rate, ${name}. The next time you want to end early, try the '1 more hour' rule. Just one more. You'll often find that's all the craving needed.` },
        { title: '🌿 Surface the Pattern', text: `${100 - rate}% of your fasts end early, ${name}. That's information, not failure. What's happening at the moment you stop? Boredom, stress, social pressure? Naming it is how you change it.` },
        { title: '🌊 Wave Rider',         text: `Cravings are waves, ${name} — they peak and crash. Your ${rate}% completion rate suggests a specific wave is winning. Ride the next one for 20 minutes and watch it dissolve.` },
        { title: '🌸 Lower the Bar',      text: `${rate}% completion rate. If you're ending early, consider a shorter protocol for 2 weeks — 100% completion at 14 hours beats 50% at 16 every time.` },
        { title: '🌺 Audit the Moment',   text: `${100 - rate}% early endings, ${name}. Before stopping a fast, wait 10 minutes and drink 500ml of water. If you still want to stop after that — stop. But most people don't.` },
      ]));
    } else if (rate >= 85) {
      pool.push(pick([
        { title: `🏆 Bloom Rate ${rate}%`, text: `${rate}% of your fasts reach full bloom, ${name}. That level of follow-through is rare. Your garden reflects it.` },
        { title: '🌺 Iron Discipline',    text: `${rate}% completion rate. You don't just start fasts — you finish them. That trait transfers to everything else in life, ${name}.` },
        { title: '🌸 Almost Perfect',     text: `${rate}% of fasts completed in full. You've trained your brain to override short-term discomfort for long-term gain. That's a skill, not luck.` },
        { title: '🌿 Finisher',           text: `${rate}% completion, ${name}. The defining trait of every long-term faster isn't starting — it's finishing. You've got that one nailed.` },
        { title: '🌻 High Bar Set',       text: `${rate}% completion rate is setting a high bar, ${name}. Most people who track their fasts sit at 60-70%. You're operating well above that.` },
        { title: '🌳 Earned Trust',       text: `${rate}%, ${name}. That means when you start a fast, your track record says: this one gets finished. You've built a reputation with yourself.` },
        { title: '🌺 Reliable',           text: `${rate}% — you are the most reliable person in your fasting practice, ${name}. You show up for yourself at a rate most people reserve for work deadlines.` },
        { title: '🌸 Strong Follow-Through', text: `${rate}% completion rate. High follow-through on fasts correlates strongly with follow-through in other areas of life. This habit is teaching you something beyond health.` },
      ]));
    }
  }

  // ================================================================
  //  FAVORITE PLAN
  // ================================================================
  if (completed.length > 0) {
    const planCounts = {};
    allFasts.forEach(f => { if (f.planName) planCounts[f.planName] = (planCounts[f.planName] || 0) + 1; });
    const favPlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0];
    if (favPlan && favPlan[1] >= 3) {
      pool.push(pick([
        { title: `🗓️ Your Rhythm: ${favPlan[0]}`,    text: `You've leaned on ${favPlan[0]} ${favPlan[1]} times. Consistency with a single protocol is more effective than switching — your body thrives on predictable fasting windows.` },
        { title: `⏱️ ${favPlan[0]} Is Your Protocol`, text: `${favPlan[0]} ${favPlan[1]} times and counting. When a plan stops working, it's rarely the plan — it's usually sleep, stress, or eating window quality.` },
        { title: `🌿 Committed to ${favPlan[0]}`,    text: `${favPlan[1]} fasts on ${favPlan[0]}, ${name}. Sticking to one protocol lets your body fully adapt instead of constantly adjusting. You're doing this right.` },
        { title: `🌸 ${favPlan[0]} Expert`,          text: `${favPlan[1]} runs on ${favPlan[0]}, ${name}. You're developing genuine expertise with this protocol — you know how your body responds at hour 4, 8, 12. That knowledge is valuable.` },
        { title: `🌺 Owned Protocol`,               text: `${favPlan[0]} ${favPlan[1]} times — this protocol is yours now, ${name}. You've done it enough to stop thinking about it and just live it.` },
        { title: `🌿 Familiar Ground`,              text: `${favPlan[1]} fasts on ${favPlan[0]}, ${name}. Familiar protocols produce the best results because your body isn't spending energy adapting to a new stimulus every time — it just performs.` },
        { title: `🌱 Consistent Choice`,            text: `${favPlan[0]} ${favPlan[1]} times shows discipline, ${name}. The urge to switch protocols is often just the brain looking for novelty. You've resisted it and built something real.` },
        { title: `⏰ Rhythm Locked`,               text: `${favPlan[1]} reps of ${favPlan[0]}, ${name}. Your body now anticipates this window physiologically — hunger hormones, cortisol, and energy levels have all synchronized to your schedule.` },
      ]));
    }
  }

  // ================================================================
  //  WELLNESS METRICS
  // ================================================================
  if (recentMetrics.length >= 3) {
    const avg = key => Math.round(recentMetrics.reduce((s, m) => s + (m[key] || 0), 0) / recentMetrics.length * 10) / 10;
    const avgMood = avg('mood'), avgSleep = avg('sleep'), avgEnergy = avg('energy');
    const half = Math.floor(recentMetrics.length / 2);
    const oldSlice   = recentMetrics.slice(0, half);
    const freshSlice = recentMetrics.slice(half);
    const trendAvg = (arr, key) => arr.length ? arr.reduce((s, m) => s + (m[key] || 0), 0) / arr.length : 0;
    const moodTrend   = trendAvg(freshSlice, 'mood')   - trendAvg(oldSlice, 'mood');
    const energyTrend = trendAvg(freshSlice, 'energy') - trendAvg(oldSlice, 'energy');
    const sleepTrend  = trendAvg(freshSlice, 'sleep')  - trendAvg(oldSlice, 'sleep');

    // ---- Mood ----
    if (moodTrend >= 1) {
      pool.push(pick([
        { title: '😊 Mood Rising',        text: `Your mood scores have been climbing, ${name}. Fasting often reduces inflammation which directly impacts emotional regulation. You're feeling the effect.` },
        { title: '🌸 Emotional Bloom',    text: `Mood trending up. Reduced insulin spikes from fasting calm the emotional rollercoaster most people don't realize food is driving.` },
        { title: '😊 Lighter Mind',       text: `Your mood data is going up, ${name}. Ketones produced during fasting are a preferred fuel for the brain — cleaner energy often means cleaner thoughts.` },
        { title: '🌺 Upward Spiral',      text: `Mood rising, ${name}. Better mood improves your choices. Better choices improve your mood. You're in an upward spiral — protect the inputs creating it.` },
        { title: '🌸 Less Noise',         text: `Your mood is trending up, ${name}. Fasting reduces the blood sugar swings that create low-grade irritability and anxiety most people attribute to stress. It's often diet.` },
        { title: '😊 Emotional Clarity',  text: `Mood scores climbing, ${name}. Reduced neuroinflammation from fasting is likely contributing. When the brain isn't fighting inflammation, emotional regulation becomes noticeably easier.` },
        { title: '🌿 Happier Baseline',   text: `Your mood metrics are improving, ${name}. Consistent fasting has been shown to raise baseline dopamine sensitivity — meaning ordinary moments feel more satisfying.` },
        { title: '🌸 Mind Following Body', text: `Mood trending positive, ${name}. Your body and mind are tracking together — when the body feels good, the mind follows. You're seeing that feedback loop in your own data.` },
        { title: '😊 Inflammation Lifting', text: `Mood up, ${name}. Chronic low-grade inflammation — the kind most people live with silently — depresses mood. Every day of fasting reduces that baseline. You're feeling it.` },
        { title: '🌺 Emotional Investment', text: `Your emotional wellness is trending up, ${name}. Fasting is one of the few lifestyle interventions with measurable effects on mood independent of weight or fitness changes.` },
      ]));
    } else if (moodTrend <= -1.5) {
      pool.push(pick([
        { title: '💙 Mood Check-in',      text: `Your mood has dipped recently. Make sure you're eating nutrient-dense meals in your window — micronutrient deficiencies can mask as low mood.` },
        { title: '💙 Low Mood Signal',    text: `Mood scores have dropped, ${name}. Extended fasting can elevate cortisol — if you're feeling emotionally flat, try shortening your window by 2 hours for a week.` },
        { title: '🌿 Tend to Yourself',   text: `Your mood metrics suggest some strain. Don't fight fasting and life stress simultaneously — when life is heavy, a wider window and maintaining is perfectly valid.` },
        { title: '💙 Fuel the Mind',      text: `Mood dipping, ${name}. Fasting is a physiological stress — if other stressors are high right now, reduce the fasting stress temporarily. Your streak matters less than your wellbeing.` },
        { title: '🌿 Cortisol Check',     text: `Mood down, ${name}. Long fasting windows can spike cortisol, which directly suppresses mood. Try eating your first meal an hour earlier for a week and see how mood responds.` },
        { title: '💙 Nutrient Window',    text: `Your mood metrics have dipped, ${name}. When fasting, the quality of your eating window becomes critical for mood — omega-3s, B vitamins, and magnesium all affect emotional regulation directly.` },
        { title: '🌸 Honor the Signal',   text: `Mood score dropping, ${name}. Your body is communicating something. Rather than pushing through, investigate — is it sleep, food quality, stress, or fasting timing?` },
        { title: '💙 Permission to Ease', text: `Mood dipping in your metrics, ${name}. There's no award for fasting through misery. A shorter window for 7 days to let your system recover is a smart move, not a failure.` },
        { title: '🌿 Recalibrate',        text: `Mood trend is down, ${name}. Consider whether your eating window includes enough complex carbohydrates — they're precursors to serotonin and often the first casualty of aggressive fasting protocols.` },
        { title: '💙 Look Deeper',        text: `Mood metrics falling, ${name}. Check your sleep first — poor sleep is the most reliable predictor of low mood, more than any fasting variable.` },
      ]));
    } else if (avgMood >= 8) {
      pool.push(pick([
        { title: '😊 Thriving',           text: `Mood averaging ${avgMood}/10, ${name}. Note what you're doing differently right now — sleep, food choices, activity — and protect it.` },
        { title: '🌺 High Baseline',      text: `Your mood is sitting at ${avgMood}/10. That's not luck, it's the accumulation of good inputs. Fasting is one piece of it.` },
        { title: '😊 Peak Emotional Health', text: `${avgMood}/10 average mood, ${name}. You're in the range where life genuinely feels good most of the time. That's rarer than people admit — protect what's creating it.` },
        { title: '🌸 Document This',      text: `Mood at ${avgMood}/10, ${name}. On the days it dips, come back to this data. You have proof that this protocol — your fasting, your habits — produces a ${avgMood}/10 mood. That's the target.` },
        { title: '🌺 Emotional Peak',     text: `${avgMood}/10, ${name}. This is what consistent fasting does over time for many people — it lifts the emotional baseline, quietly and permanently.` },
        { title: '😊 Living Well',        text: `Your mood metrics are excellent, ${name}. At ${avgMood}/10 you're not just healthy — you're genuinely well. There's a difference and your data reflects it.` },
      ]));
    }

    // ---- Energy ----
    if (energyTrend >= 1) {
      pool.push(pick([
        { title: '⚡ Energy Blooming',    text: `Energy trending up over your last ${recentMetrics.length} check-ins (avg ${avgEnergy}/10). Your mitochondria are adapting — this is fat adaptation in action.` },
        { title: '⚡ Metabolic Engine On', text: `Rising energy scores, ${name}. When you stop relying on glucose every few hours, your energy becomes steady rather than spiked and crashed. You're living that now.` },
        { title: '⚡ Waking Up',          text: `Your energy data is climbing. Many people report the biggest energy leap between fasts 10 and 20 — you may be hitting that window right now.` },
        { title: '⚡ Upward Trend',       text: `Energy rising, ${name}. This trajectory is one of the best signs of metabolic adaptation. Your body is getting more efficient at energy production, not just at fasting.` },
        { title: '⚡ Fat Fuel Active',    text: `Energy scores going up, ${name}. Beta-oxidation — fat burning for fuel — is running more efficiently now. The energy from fat is steadier and longer-lasting than glucose. That's what you're feeling.` },
        { title: '⚡ Mitochondrial Growth', text: `Rising energy, ${name}. Fasting triggers mitochondrial biogenesis — your cells are literally growing more energy-producing machinery. More mitochondria = more sustainable energy.` },
        { title: '⚡ Steady State',       text: `Energy trending up, ${name}. You're moving away from the energy spike-and-crash cycle of glucose dependence toward the steady, reliable energy of fat adaptation. It only gets better from here.` },
        { title: '⚡ Thriving Signal',    text: `Your energy scores are climbing, ${name}. This is the number people mean when they say fasting changed their life — not weight, but the feeling of having real, clean energy all day.` },
        { title: '⚡ Clean Fuel',         text: `Energy up, ${name}. Ketones — the fuel your body produces during fasting — generate more ATP per molecule than glucose and produce less oxidative stress. You're running on cleaner fuel.` },
        { title: '⚡ Building Momentum', text: `Energy rising, ${name}. Keep tracking this. People who see energy trending up at this stage almost always report dramatically higher energy in another month if they stay consistent.` },
      ]));
    } else if (avgEnergy <= 4) {
      pool.push(pick([
        { title: '⚡ Low Energy Signal',  text: `Average energy at ${avgEnergy}/10, ${name}. Try extending your eating window slightly or adding more protein and healthy fats during your window.` },
        { title: '⚡ Fuel Quality Matters', text: `Low energy at ${avgEnergy}/10. This often comes down to what — not when — you eat. One meal of processed food can tank energy for 24 hours.` },
        { title: '🌱 Recharge Needed',    text: `Energy averaging low, ${name}. Check your electrolytes — sodium, magnesium, and potassium drop during fasting and are the #1 cause of low-energy fasts.` },
        { title: '⚡ Adaptation Phase',   text: `Energy at ${avgEnergy}/10, ${name}. If you're in your first few weeks, this is normal — the transition from glucose to fat burning creates a temporary energy dip known as the 'keto flu.' It passes.` },
        { title: '🌿 Protein Check',      text: `Low energy at ${avgEnergy}/10, ${name}. Ensure your eating window includes adequate protein — 0.7-1g per pound of body weight is the target. Undereating protein is the silent killer of fasting energy.` },
        { title: '⚡ Electrolyte Gap',    text: `Energy averaging ${avgEnergy}/10, ${name}. Try sodium (¼ tsp sea salt), magnesium (300-400mg), and potassium during your fasting window. Many people feel the difference within an hour.` },
        { title: '🌱 Less Is More',       text: `Energy low at ${avgEnergy}/10, ${name}. Counterintuitively, a shorter fasting window often raises energy more than a longer one if you're under-fueling during the eating window. Quality over duration.` },
        { title: '⚡ Sleep Connection',   text: `Energy at ${avgEnergy}/10, ${name}. Check your sleep scores — poor sleep accounts for up to 40% of daytime energy variance. No fasting protocol can overcome chronic sleep deficit.` },
      ]));
    } else if (avgEnergy >= 8) {
      pool.push(pick([
        { title: '⚡ High Energy State',  text: `Energy at ${avgEnergy}/10 average, ${name}. Your body has fully adapted to using fat as fuel. This is the state long-term fasters describe as the real reward.` },
        { title: '⚡ Peak Adapted',       text: `${avgEnergy}/10 average energy. Save your hardest workouts and most demanding work for your late fasting window — your mind and body are sharpest there.` },
        { title: '⚡ Operating at Peak',  text: `${avgEnergy}/10 energy average, ${name}. You've arrived at a place most people don't believe is achievable without caffeine and food — fully energized while fasting.` },
        { title: '⚡ Preserve This',      text: `Energy at ${avgEnergy}/10, ${name}. High-energy states are fragile — poor sleep, one bad eating window, or heavy stress can knock you back. Protect the inputs that built this.` },
        { title: '⚡ Beyond Normal',      text: `${avgEnergy}/10 average energy is beyond most people's baseline on their best days, ${name}. This is what metabolic health actually feels like.` },
        { title: '⚡ Fat-Fueled',         text: `Energy scoring ${avgEnergy}/10, ${name}. Fat-adapted energy is a different quality from glucose energy — steadier, longer, without the mid-afternoon crash. You know this because you're living it.` },
      ]));
    }

    // ---- Sleep ----
    if (avgSleep <= 5) {
      pool.push(pick([
        { title: '🌙 Sleep is the Root',  text: `Sleep averaging ${avgSleep}/10. Deep sleep is when autophagy peaks and growth hormone surges — your fasting benefits are amplified by quality rest.` },
        { title: '🌙 Prioritize the Night', text: `Sleep scores at ${avgSleep}/10, ${name}. Poor sleep raises ghrelin by up to 30% the next day. Fasting on bad sleep is playing on hard mode.` },
        { title: '😴 The Missing Piece',  text: `Your sleep scores suggest an opportunity, ${name}. Try closing your eating window 3+ hours before bed — food digestion disrupts deep sleep more than most people realize.` },
        { title: '🌙 Sleep Debt',         text: `Sleep at ${avgSleep}/10, ${name}. Sleep debt accumulates silently and undermines every health goal — fasting, fitness, mood. One week of 7+ hour nights will change your results more than any protocol tweak.` },
        { title: '😴 Repair Window',      text: `Sleep averaging ${avgSleep}/10, ${name}. The cellular repair that fasting initiates during the day is completed during deep sleep at night. Without the sleep, you're leaving half the benefit on the table.` },
        { title: '🌙 Hunger Amplified',   text: `Sleep at ${avgSleep}/10, ${name}. Every hour of lost sleep elevates the hunger hormone ghrelin the next day. If fasting feels harder than usual — look at the night before.` },
        { title: '🌿 Night is Medicine',  text: `Sleep scores at ${avgSleep}/10, ${name}. During deep sleep your brain clears metabolic waste via the glymphatic system — a process that's impaired when you eat close to bedtime. Move dinner earlier.` },
        { title: '😴 The Lever to Pull',  text: `Sleep at ${avgSleep}/10 is the single biggest lever you can pull right now, ${name}. Everything — mood, energy, fasting ease, fat loss — responds dramatically to better sleep quality.` },
        { title: '🌙 Fix the Foundation', text: `Sleep averaging ${avgSleep}/10, ${name}. A fasting practice built on poor sleep is a house on sand. Fix the foundation: earlier meals, cooler room, consistent bedtime.` },
        { title: '😴 Magnesium Gap',      text: `Sleep at ${avgSleep}/10, ${name}. Magnesium glycinate (300mg before bed) is safe during fasting and genuinely improves sleep quality for most people within a week. Worth trying.` },
      ]));
    } else if (sleepTrend >= 1) {
      pool.push(pick([
        { title: '🌙 Sleep Improving',    text: `Sleep quality trending upward. Many people find fasting improves sleep by stabilizing blood sugar overnight. You may be experiencing this firsthand.` },
        { title: '🌙 Restoring',          text: `Your sleep scores are climbing, ${name}. Consistent meal timing trains your circadian clock — better sleep is one of fasting's most underrated benefits.` },
        { title: '😴 Deeper Rest Ahead',  text: `Sleep improving across your last few check-ins. As you continue, REM sleep tends to lengthen — you may start waking more restored than before.` },
        { title: '🌙 Circadian Healing',  text: `Sleep trending up, ${name}. Consistent fasting windows teach your circadian rhythm when to expect food and when to sleep — a natural clock reset that most people never experience.` },
        { title: '😴 Sleep Dividend',     text: `Sleep improving, ${name}. Better sleep makes fasting easier, which improves sleep further. You're entering a virtuous cycle that will keep amplifying.` },
        { title: '🌙 Night Rewarded',     text: `Sleep scores rising, ${name}. Closing your eating window earlier likely contributed. The body rewards predictable patterns — your circadian clock is syncing.` },
        { title: '😴 Recovery Unlocked',  text: `Sleep trending upward, ${name}. Better sleep means more growth hormone, more autophagy, and better emotional regulation. Your recovery is accelerating.` },
        { title: '🌙 Restoration Rising', text: `Sleep scores improving, ${name}. This is one of the fasting benefits that sneaks up on people — better sleep isn't what they came for but it's often what they stay for.` },
      ]));
    } else if (avgSleep >= 8) {
      pool.push(pick([
        { title: '🌙 Rested and Ready',   text: `Sleeping well at ${avgSleep}/10, ${name}. Quality sleep is when your body does most of its repair from fasting. You're compounding your results overnight.` },
        { title: '😴 Sleep Champion',     text: `${avgSleep}/10 average sleep, ${name}. Consistent sleep + fasting is one of the most powerful longevity combinations available. You're doing both.` },
        { title: '🌙 Night Optimized',    text: `Sleep at ${avgSleep}/10, ${name}. You've optimized your nights. The growth hormone that surges during deep sleep combined with your fasting is an anti-aging pairing that's hard to beat.` },
        { title: '😴 Strong Foundation',  text: `${avgSleep}/10, ${name}. Great sleep is a force multiplier — it amplifies every other healthy behavior. Your fasting, your focus, your mood all benefit from this baseline.` },
        { title: '🌙 Recovery Master',    text: `${avgSleep}/10 sleep average, ${name}. Most people underinvest in sleep while doing everything else right. You're not most people.` },
      ]));
    }

    // Best metric
    const pairs = [['mood', avgMood], ['sleep', avgSleep], ['energy', avgEnergy]];
    pairs.sort((a, b) => b[1] - a[1]);
    if (pairs[0][1] >= 7) {
      const labels = { mood: 'mood 😊', sleep: 'sleep 🌙', energy: 'energy ⚡' };
      const capKey = pairs[0][0].charAt(0).toUpperCase() + pairs[0][0].slice(1);
      pool.push(pick([
        { title: `✨ Strong ${capKey}`,   text: `Your ${labels[pairs[0][0]]} is your brightest metric at ${pairs[0][1]}/10. Protect what's driving it — note the habits on those high-${pairs[0][0]} days.` },
        { title: `🌺 Leading with ${capKey}`, text: `${pairs[0][1]}/10 for ${labels[pairs[0][0]]} is genuinely strong, ${name}. Use that as your anchor on harder days — you know what it feels like to be at your best.` },
        { title: `🌸 ${capKey} Strength`, text: `${pairs[0][1]}/10 ${pairs[0][0]}, ${name}. That's your highest metric. Track what's producing it and replicate it deliberately.` },
        { title: `⭐ Best Category`,      text: `${labels[pairs[0][0]]} leading at ${pairs[0][1]}/10, ${name}. A strong ${pairs[0][0]} lifts everything else — it's the rising tide metric.` },
        { title: `🌿 Anchor Metric`,      text: `${pairs[0][1]}/10 on ${pairs[0][0]}, ${name}. When things feel hard, this is your proof that the practice is working. Don't lose sight of what strong looks like.` },
      ]));
    }

    // Lowest metric
    if (pairs[2][1] <= 5) {
      const advice = {
        mood:   'Try shortening your window slightly and adding more omega-3s and B-vitamin rich foods.',
        sleep:  'Close your eating window 3+ hours before bed and cut caffeine after noon.',
        energy: 'Add electrolytes (sodium, magnesium) during your fasting window — they drop fast when fasting.'
      };
      const lbl = pairs[2][0].charAt(0).toUpperCase() + pairs[2][0].slice(1);
      pool.push(pick([
        { title: `🌱 Grow Your ${lbl}`,   text: `Your lowest metric is ${pairs[2][0]} at ${pairs[2][1]}/10. ${advice[pairs[2][0]]}` },
        { title: `🌿 ${lbl} Opportunity`, text: `${lbl} at ${pairs[2][1]}/10 is your growth edge right now, ${name}. ${advice[pairs[2][0]]}` },
        { title: `🌸 Weakest Link`,       text: `${pairs[2][0]} is lagging at ${pairs[2][1]}/10, ${name}. Improving your weakest metric lifts your overall wellness score more than improving your strongest one. Focus here.` },
      ]));
    }

  } else if (recentMetrics.length === 0 && completed.length >= 2) {
    pool.push(pick([
      { title: '📊 Track Your Bloom',    text: `${name}, you've completed fasts but haven't logged wellness metrics yet. Mood, sleep, and energy data will unlock much sharper insights.` },
      { title: '🌸 Missing the Picture', text: `Fasting data alone only tells half the story, ${name}. Log your mood, sleep, and energy in the Wellness tab and I'll show you the patterns in your own data.` },
      { title: '🌿 Hidden Insights',     text: `${name}, you have fasting data but no wellness metrics. The correlations between your fasting windows and how you feel are hiding in plain sight — they just need to be logged.` },
      { title: '📈 Unlock the Trends',   text: `Metrics unlock the coach, ${name}. 7 days of mood, sleep, and energy logging will tell me more about your body than ${completed.length} fasts alone.` },
      { title: '🌸 Full Picture',        text: `You're fasting consistently, ${name}. Now tell me how you feel — the wellness check-in takes 10 seconds and gives both of us so much more to work with.` },
    ]));
  }

  // ================================================================
  //  JOURNAL PATTERNS
  // ================================================================
  const combinedJournal = recentJournal.map(j => j.text?.toLowerCase() || '').join(' ');
  if (combinedJournal) {
    if (combinedJournal.match(/tired|exhausted|fatigue|drained|sluggish|lethargic/)) {
      pool.push(pick([
        { title: '😴 Fatigue Pattern',    text: `Your journal mentions fatigue. Consider whether your eating window provides enough calories and iron-rich foods — fatigue is the #1 sign of under-fueling during fasting.` },
        { title: '🌿 Energy Drain',       text: `Tiredness shows up in your recent entries. Check your eating window quality — specifically protein and complex carbs on days before a longer fast.` },
        { title: '🌱 Fueling Gap',        text: `Fatigue in your journal, ${name}. During fasting, what you eat in your window matters more than usual — your cells are running leaner and need high-quality inputs.` },
        { title: '⚡ Iron Check',         text: `Fatigue mentioned, ${name}. Low ferritin (stored iron) is common in fasters and creates persistent tiredness that doesn't respond to sleep. If fatigue is chronic, an iron panel is worth running.` },
        { title: '😴 Caloric Deficit',    text: `Your journal mentions tiredness, ${name}. Aggressive fasting combined with eating too little in the window creates a caloric deficit that eventually catches up as fatigue. Feed yourself well in your window.` },
        { title: '🌿 Adapt or Adjust',    text: `Fatigue showing up in your entries, ${name}. In the early weeks this is adaptation. After 4+ weeks, it's usually a signal to adjust — eating window quality, electrolytes, or window duration.` },
        { title: '🌱 Adrenal Load',       text: `Tiredness noted, ${name}. Extended fasting adds cortisol load. If life is also demanding right now, your adrenals are carrying double stress. A shorter window for a week can be recovery, not retreat.` },
        { title: '⚡ Magnesium Low',      text: `Fatigue in your journal, ${name}. Magnesium depletion during fasting causes fatigue, muscle weakness, and poor sleep — often confused for hunger or general tiredness. 300mg with a meal often resolves it.` },
      ]));
    }

    if (combinedJournal.match(/hungry|craving|starving|appetite|ravenous|snack/)) {
      pool.push(pick([
        { title: '💧 Hunger vs. Thirst',  text: `Cravings show up in your recent entries. Your brain can't distinguish hunger from thirst — try 500ml of water when a craving hits. It works more often than you'd expect.` },
        { title: '🌊 Riding the Wave',    text: `Hunger comes in waves, not a steady climb. Your journal notes cravings — next time one hits, wait 15 minutes. It almost always passes. You've already done it before.` },
        { title: '🌿 Ghrelin Is Lying',   text: `Cravings noted are likely ghrelin spikes — timed to when you used to eat, not real hunger. Shift the timing and the cravings will follow.` },
        { title: '💧 15-Minute Rule',     text: `Hunger in your journal, ${name}. Cravings peak and pass in 15-20 minutes. Set a timer next time. You almost never want food as badly after the timer goes off.` },
        { title: '🌊 Phantom Hunger',     text: `Cravings showing up in your entries, ${name}. Phantom hunger — feeling hungry at the time you used to eat — disappears once your eating window shifts. Your body is still learning the new schedule.` },
        { title: '🌿 Appetite Hormones',  text: `Hunger mentioned in your journal, ${name}. Ghrelin, your main hunger hormone, peaks around when you used to eat. After 2-3 weeks at a new schedule, those peaks restructure. You're in the transition.` },
        { title: '💧 Stay Ahead',         text: `Cravings in your journal, ${name}. Staying 2-3 glasses of water ahead of thirst is the single easiest hunger management strategy there is. Most people get to cravings because they haven't been drinking.` },
        { title: '🌊 The Craving Is Information', text: `Hunger in your entries, ${name}. Ask: what time is it? What were you doing? These cravings reveal your weak points — the hours, the emotions, the situations where you're most vulnerable. Address those specifically.` },
        { title: '🌿 Distraction Protocol', text: `Cravings noted, ${name}. The brain can't sustain a craving and engage with something genuinely absorbing simultaneously. For 15 minutes: walk, call someone, do 5 minutes of focused work. The craving will be gone.` },
      ]));
    }

    if (combinedJournal.match(/great|amazing|strong|proud|accomplished|incredible|fantastic|winning|crushed|nailed/)) {
      pool.push(pick([
        { title: '🌟 Victory Mindset',    text: `Your journal is full of wins, ${name}. Documenting victories isn't just motivating — it rewires how your brain perceives the challenge. Keep writing them down.` },
        { title: '🏆 Own Your Wins',      text: `Positive energy in your recent entries, ${name}. Athletes who journal their victories outperform those who don't. Your brain is being trained to expect success.` },
        { title: '🌸 High Vibe',          text: `Your recent journal reads like someone who fully believes in what they're doing. That confidence compounds, ${name} — keep feeding it.` },
        { title: '🌺 Evidence Stacking',  text: `Your journal entries stack wins, ${name}. Evidence stacking — deliberately noting each success — is one of the most research-backed ways to build lasting behavior change.` },
        { title: '🌟 Identity Reinforced', text: `Wins in your journal, ${name}. Every victory you write down reinforces the identity: 'I am someone who fasts.' That identity is more durable than motivation.` },
        { title: '🌸 Keep the Record',    text: `Your entries radiate positivity, ${name}. These journal entries become your evidence on hard days — proof written by past you that this is possible and worth it.` },
        { title: '🏆 Momentum Building',  text: `Win after win in your recent entries, ${name}. Success momentum is real — each win makes the next one more likely. You're in a momentum phase. Ride it.` },
        { title: '🌺 Documenting Mastery', text: `Your journal shows mastery in progress, ${name}. The willingness to notice and write down what's working is a skill most people never develop. It's making you better.` },
        { title: '🌟 Story Worth Telling', text: `Your entries are writing a story worth telling, ${name}. A garden, a streak, wins in the journal — the person on day one didn't know this was possible. You do now.` },
      ]));
    }

    if (combinedJournal.match(/stress|anxious|anxiet|overwhelm|hard|difficult|struggle|tough|burnt|burnout/)) {
      pool.push(pick([
        { title: '🌿 Stress & Fasting',   text: `Your entries mention stress. High cortisol can make fasting feel harder and slow fat adaptation. Even 5 minutes of deep breathing before your window opens can help.` },
        { title: '🍃 Pressure Release',   text: `Stress showing up in your journal, ${name}. On high-stress days, a shorter window is better than no fast — perfection is the enemy of consistency.` },
        { title: '💙 Carry Less',         text: `Your entries feel heavy lately. Fasting is itself a stressor — when life is already loud, maintaining rather than pushing longer windows keeps your streak alive without burning you out.` },
        { title: '🌿 Cortisol Pairing',   text: `Stress in your journal, ${name}. Fasting + chronic stress both elevate cortisol. Combined, they can stall fat loss and tank energy. Protect your recovery hours — sleep, walks, stillness.` },
        { title: '💙 Reduce to Maintain', text: `Stress mentioned, ${name}. When you're under pressure, switching from 'perform' to 'maintain' mode with fasting is wise strategy. A 12-hour window with low stress beats a 16-hour window with high stress.` },
        { title: '🌿 Breathe First',      text: `Stress and struggle in your entries, ${name}. Before you eat, breathe — five slow exhales activates the parasympathetic system, reduces cortisol, and makes the next few hours of fasting noticeably easier.` },
        { title: '💙 Compassion Protocol', text: `Your journal suggests you're being hard on yourself, ${name}. The fasting practice that's sustainable is one that includes compassion. Hard days, short windows, and even broken fasts are part of a long-term practice.` },
        { title: '🌸 The Minimum Fast',   text: `Stress visible in your entries, ${name}. On your hardest days, aim for the minimum fast that keeps the habit alive — even 13 hours maintains the biological benefits and the streak.` },
        { title: '🌿 Stress Is Data',     text: `Stress in your journal, ${name}. Track what days it peaks — they're likely the same days fasting feels hardest. That's not weakness, it's a physiological fact: high cortisol amplifies hunger signals.` },
      ]));
    }

    if (combinedJournal.match(/coffee|caffeine|tea|espresso|matcha|latte/)) {
      pool.push(pick([
        { title: '☕ Caffeine Timing',    text: `Coffee and tea appear in your journal. Black coffee doesn't break a fast and can boost autophagy — just avoid it within 6 hours of sleep.` },
        { title: '☕ Fasting Fuel',       text: `Coffee noted in your entries. Caffeine blunts hunger effectively during the fasting window — just pair it with water, as caffeine is a mild diuretic.` },
        { title: '☕ Autophagy Boost',    text: `Coffee in your journal, ${name}. Black coffee actually enhances autophagy rather than blocking it. It's one of the few fasting-safe compounds with genuine benefits during the window.` },
        { title: '☕ Caffeine + Fasting', text: `Caffeine noted, ${name}. The combination of caffeine and fasting creates a meaningful catecholamine surge — heightened focus, accelerated fat oxidation, and suppressed appetite. Use it strategically.` },
        { title: '☕ Green Tea Advantage', text: `Tea in your journal, ${name}. Green tea in particular contains EGCG, which amplifies fat oxidation during fasting. If you haven't tried it during your window, it's worth experimenting with.` },
        { title: '☕ The 6-Hour Rule',    text: `Caffeine showing up in your journal, ${name}. The most impactful change many people make: no caffeine within 6 hours of sleep. The sleep improvement often outperforms any fasting protocol tweak.` },
      ]));
    }

    if (combinedJournal.match(/workout|exercise|gym|run|running|walk|training|lifted|yoga|cardio|swim/)) {
      pool.push(pick([
        { title: '💪 Fasted Training',    text: `Exercise shows up in your journal, ${name}. Fasted workouts increase fat oxidation and growth hormone release. Keep protein high in the meal that follows.` },
        { title: '🌿 Move While Fasting', text: `You're combining movement and fasting — a powerful pairing. Light cardio in the final hours of your window can accelerate fat adaptation without over-stressing your system.` },
        { title: '💪 Hormonal Advantage', text: `Exercise in your journal, ${name}. Working out in a fasted state elevates catecholamines and growth hormone simultaneously — a hormonal environment that powerfully supports fat loss and muscle preservation.` },
        { title: '🌿 Post-Fast Nutrition', text: `Training noted, ${name}. The meal that breaks your fast after a workout is critically important — 30-40g of protein within 60 minutes of finishing exercise maximizes muscle protein synthesis.` },
        { title: '💪 Timing Matters',     text: `Exercise in your journal, ${name}. The sweet spot for fasted training is typically 12-16 hours in — after glycogen is depleted but before energy drops. That hour or two before you break your fast.` },
        { title: '🌿 Fitness + Fasting',  text: `Exercise and fasting combined, ${name}. These two practices are synergistic — fasting improves insulin sensitivity which improves exercise recovery, which improves energy during fasting. A virtuous loop.` },
        { title: '💪 Zone 2 Magic',       text: `Movement in your journal, ${name}. Low-intensity fasted cardio (Zone 2) is the single most effective fat-burning protocol available. 30-45 minutes at a conversational pace in a fasted state burns almost exclusively fat.` },
        { title: '🌿 Strength Preserved', text: `Training noted, ${name}. A common fear about fasted exercise is muscle loss — but research consistently shows that eating enough protein in your window fully preserves muscle even during aggressive fasting protocols.` },
      ]));
    }

    if (combinedJournal.match(/headache|migraine|head ache|head pain/)) {
      pool.push(pick([
        { title: '💧 Electrolyte Signal', text: `Headaches in your journal often point to sodium deficiency. A small pinch of salt in water — many people feel relief within 20 minutes.` },
        { title: '🌿 Salt & Minerals',    text: `Headaches during fasting are usually electrolyte-related, ${name}. Your kidneys flush sodium faster without food. A pinch of sea salt in water can be a game changer.` },
        { title: '💧 Dehydration Pattern', text: `Headaches in your entries, ${name}. Fasting headaches are almost always dehydration + electrolyte loss, not hunger. 500ml of water with a pinch of salt addresses both simultaneously.` },
        { title: '🌿 Caffeine Withdrawal', text: `Headache mentioned, ${name}. If you normally have coffee or tea and skipped it during the fast, caffeine withdrawal headaches usually peak 12-24 hours after your last dose. Tapering caffeine reduces this.` },
        { title: '💧 Sodium Fast',        text: `Headaches noted, ${name}. During extended fasting, aldosterone rises and causes the kidneys to excrete sodium aggressively. Without replacing it, blood pressure can drop enough to cause headaches. Salt water is the fix.` },
      ]));
    }

    if (combinedJournal.match(/sleep|insomnia|restless|woke up|wake up|can't sleep|couldn't sleep/)) {
      pool.push(pick([
        { title: '🌙 Sleep Signals',      text: `Sleep mentions in your journal, ${name}. Try closing your eating window at least 3 hours before bed — digestion generates heat that fragments deep sleep.` },
        { title: '😴 Night Nutrition',    text: `Sleep patterns noted in your entries. Magnesium glycinate before bed is safe during fasting and improves sleep quality for most people significantly.` },
        { title: '🌙 Circadian Timing',   text: `Sleep issues in your journal, ${name}. Late eating is the most common disruptor of sleep quality. Moving your eating window earlier by just one hour often produces dramatic improvements.` },
        { title: '😴 Temperature Drop',   text: `Sleep mentioned in your entries, ${name}. Core body temperature needs to drop 1-2°C to initiate sleep. Eating late keeps body temperature elevated. Fasting your way to bedtime makes sleep onset faster and deeper.` },
        { title: '🌙 The Hunger Wake',    text: `Sleep issues in your journal, ${name}. Waking in the night is sometimes real hunger if you're in a significant caloric deficit. Ensure your eating window is genuinely fueling your energy needs before bed.` },
      ]));
    }

    if (combinedJournal.match(/motivat|give up|quit|why am i|whats the point|not working|doesn't work|no progress/)) {
      pool.push(pick([
        { title: '🌱 Doubt Is Normal',    text: `The fact you're questioning it means you're taking it seriously, ${name}. Every long-term faster has the 'why am I doing this' moment. The ones who push through it are the ones with full gardens.` },
        { title: '🌿 The Dip',            text: `Motivation dips are part of every long-term habit, ${name}. Don't make permanent decisions based on a hard week. Just do tomorrow's fast and reassess then.` },
        { title: '🌸 Progress Is Invisible', text: `Doubts in your journal, ${name}. Most fasting progress is happening at the cellular level where you can't see it. The metabolic changes are real and accumulating — the visible results lag behind.` },
        { title: '🌺 The Doubt Dip',      text: `Motivation dip in your entries, ${name}. Week 3-4 is the most common dropout point — the novelty has worn off and the dramatic results haven't fully arrived. Most long-term fasters passed through exactly this moment.` },
        { title: '🌱 Evidence Check',     text: `Doubts in your journal, ${name}. Look at your streak. Look at your garden. Look at your completed fast count. The evidence of your commitment is already there — it's not a feeling, it's a record.` },
        { title: '🌿 Give It 90 Days',    text: `Motivation low, ${name}. No dietary or lifestyle change reveals its full effect in less than 90 days. Whatever you're feeling now is not the final result. The full result requires more time.` },
        { title: '💙 Honor the Feeling',  text: `Struggle in your entries, ${name}. These feelings are real and valid — this is hard. But hard and wrong are different things. This is hard and right.` },
      ]));
    }

    if (combinedJournal.match(/happy|joy|peaceful|peace|calm|grateful|gratitude|content|clear|focused|sharp|present/)) {
      pool.push(pick([
        { title: '🌸 Mental Clarity',     text: `Your journal reflects a clear, focused mind, ${name}. Ketones and reduced blood sugar variance are likely contributors. Protect the habits producing this.` },
        { title: '🌟 In Flow',            text: `Happiness and clarity in your recent entries, ${name}. Fasting-related BDNF increase and lower neuroinflammation make this more than coincidence — you've earned this state.` },
        { title: '🌺 Thriving State',     text: `Your journal radiates wellbeing, ${name}. This is the result that doesn't show up on a scale — the quiet, clear, steady feeling that comes from a consistent practice. It's real. Protect it.` },
        { title: '🌸 Peace Is Progress',  text: `Calm and peace in your journal, ${name}. Emotional steadiness is one of the most underrated fasting benefits. Stable blood sugar means stable neurotransmitters means stable moods.` },
        { title: '🌿 This Is the Point',  text: `Clarity and focus in your entries, ${name}. When people ask why you fast, 'I think better and feel more at peace' is a more honest answer than any health statistic.` },
        { title: '🌺 Grateful Practice',  text: `Gratitude in your journal, ${name}. Fasting and gratitude practice have something in common — both require presence, both change your relationship with desire, and both compound with consistency.` },
        { title: '🌸 High State',         text: `Your entries describe a high-functioning, grounded state, ${name}. The mental clarity that comes from fasting is one of the earliest and most consistent benefits people report. You're fully in it.` },
      ]));
    }

    if (combinedJournal.match(/food|meal|dinner|lunch|breakfast|ate|eating|ate too much|overate/)) {
      pool.push(pick([
        { title: '🍽️ Window Quality',     text: `Food mentions in your journal, ${name}. What you eat in your eating window matters enormously when fasting — the nutrients from your meals are doing all the recovery and repair work.` },
        { title: '🌿 Break-Fast Matters', text: `Meals noted in your entries, ${name}. The meal that breaks your fast has an outsized effect. High-protein, low-sugar first meals set your hunger signals for the rest of the day.` },
        { title: '🍽️ Whole Window',       text: `Eating patterns in your journal, ${name}. Think of your eating window as a whole unit, not individual meals. Spacing two meals and planning their macros often works better than reacting to hunger.` },
        { title: '🌱 Post-Fast Protocol', text: `Food mentioned in your entries, ${name}. Breaking a fast with large amounts of refined carbohydrates creates the blood sugar spike that makes the next fast harder. Start with protein and fat, add carbs later.` },
        { title: '🌿 Nutrient Timing',    text: `Meals showing up in your journal, ${name}. After a long fast, your cells are unusually receptive to nutrients — like a garden just watered. High-quality food during this window has amplified effects.` },
      ]));
    }

    if (combinedJournal.match(/weight|scale|pounds|lbs|kilos|lost|gained|weigh/)) {
      pool.push(pick([
        { title: '⚖️ Beyond the Scale',   text: `Weight mentioned in your journal, ${name}. The scale measures one variable. Fasting is changing dozens — insulin sensitivity, inflammation, cognitive function, gut microbiome. Don't let one number carry all the meaning.` },
        { title: '🌿 Non-Scale Wins',     text: `Weight on your mind, ${name}. Log how your clothes fit, how your sleep is, how your focus feels — the non-scale victories are often more durable motivators than numbers on a display.` },
        { title: '⚖️ Recomposition',      text: `Weight mentioned, ${name}. If you're exercising while fasting, the scale can stay still or move up while you're simultaneously losing fat and gaining muscle. Body recomposition doesn't show well on a scale — progress photos do.` },
        { title: '🌱 Patient Progress',   text: `Weight in your journal, ${name}. Fat loss from fasting tends to come in waves — 2-3 weeks of plateau followed by a noticeable drop. If the scale hasn't moved in a week, something is likely shifting underneath.` },
      ]));
    }
  }

  // ================================================================
  //  HYDRATION
  // ================================================================
  const waterHistory = store.state.water.history || [];
  if (waterHistory.length >= 3) {
    const avgGlasses = waterHistory.slice(-7).reduce((s, h) => s + (h.glasses || 0), 0) / Math.min(waterHistory.length, 7);
    if (avgGlasses < 4) {
      pool.push(pick([
        { title: '💧 Hydration Gap',      text: `Averaging under 4 glasses per fasting window, ${name}. Dehydration mimics hunger, slows autophagy, and tanks energy. Aim for 8 glasses.` },
        { title: '💧 Drink More',         text: `Low hydration in your history, ${name}. During fasting you lose water faster without food — most fasting fatigue is dehydration wearing a disguise.` },
        { title: '🌊 Water First',        text: `Under 4 glasses average. Before reaching for food to end a craving, drink a full glass of water. It solves the problem more than half the time.` },
        { title: '💧 The Dehydration Trap', text: `Low water intake, ${name}. Mild dehydration — just 1-2% below optimal — impairs cognition, amplifies hunger, and reduces physical performance by 10-20%. You don't need to be thirsty for it to affect you.` },
        { title: '🌊 Hydration Timing',   text: `Water intake low, ${name}. Spread your water intake through the fasting window rather than drinking large amounts at once — this maintains cellular hydration continuously rather than in spikes.` },
        { title: '💧 Cells Need Water',   text: `Under-hydrated, ${name}. During fasting your kidneys flush more water and electrolytes than normal. Dehydration here isn't just discomfort — it directly slows the autophagy and cellular repair fasting is designed to trigger.` },
        { title: '🌊 Hunger Masking',     text: `Water intake below target, ${name}. The thirst and hunger centers of the brain overlap significantly. Your body may be signaling thirst and you're interpreting it as hunger. Drink before you eat.` },
        { title: '💧 Simple Upgrade',     text: `Low hydration average, ${name}. The simplest upgrade to your fasting practice: a large glass of water first thing in the morning, one mid-fast, and one before your first meal. Three glasses sets the foundation.` },
      ]));
    } else if (avgGlasses >= 7) {
      pool.push(pick([
        { title: '💧 Hydration Champion', text: `Averaging ${Math.round(avgGlasses)} glasses per fast — your cells are thanking you. Proper hydration amplifies every fasting benefit from cognitive clarity to fat oxidation.` },
        { title: '🌊 Well Watered',       text: `Solid hydration habit, ${name}. Water at your level helps flush the metabolic waste that autophagy generates — you're getting the full benefit of every fast.` },
        { title: '💧 Flowing Strong',     text: `${Math.round(avgGlasses)} glasses average — above target. Staying hydrated during fasting keeps hunger signals honest and electrolytes balanced. Keep it up.` },
        { title: '🌊 Cellular Health',    text: `${Math.round(avgGlasses)} glasses average, ${name}. At this hydration level, your lymphatic system, kidneys, and detox pathways are all running optimally. It's the unglamorous foundation of everything else working.` },
        { title: '💧 Smart Habit',        text: `High water intake, ${name}. People who stay well-hydrated during fasting report significantly fewer cravings, better focus, and more consistent energy. Your data reflects what the research says.` },
        { title: '🌊 Clean System',       text: `${Math.round(avgGlasses)} glasses average, ${name}. Fasting produces metabolic byproducts that water clears. You're doing the internal maintenance most people don't think about.` },
      ]));
    }
  }

  // ================================================================
  //  WEIGHT TREND
  // ================================================================
  if (weights.length >= 5) {
    const recent5 = weights.slice(-5);
    const first = recent5[0].value, last = recent5[recent5.length - 1].value;
    const diff = Math.round((last - first) * 10) / 10;
    if (diff < -1) {
      pool.push(pick([
        { title: `⚖️ ${Math.abs(diff)} lbs Down`, text: `You've dropped ${Math.abs(diff)} lbs over your last weigh-ins, ${name}. Steady, gradual loss is the most sustainable — your body is adapting, not just shrinking.` },
        { title: '⚖️ Trending Down',      text: `Weight moving in the right direction, ${name}. Consistent fasting tends to show results in waves — some weeks flat, then a drop. Trust the process between the drops.` },
        { title: `⚖️ Progress Visible`,   text: `${Math.abs(diff)} lbs down, ${name}. The scale is reflecting what consistency looks like. More importantly, fat loss during fasting tends to be disproportionately visceral fat — the kind that matters most for health.` },
        { title: '⚖️ Right Direction',    text: `Scale trending down, ${name}. Slow, consistent weight loss during fasting is almost entirely fat loss — not the muscle loss that happens with aggressive calorie restriction. That's the distinction that matters.` },
        { title: `⚖️ ${Math.abs(diff)} lbs of Work`, text: `${Math.abs(diff)} lbs down, ${name}. Each pound represents roughly 3,500 calories of deficit — real, tangible biological work accomplished by your consistent practice.` },
        { title: '⚖️ Compound Effect',    text: `Weight coming down, ${name}. Even modest, consistent weight loss from fasting accumulates significantly over time. ${Math.abs(diff)} lbs in a few weeks compounds to a meaningful change over months.` },
        { title: '⚖️ Visceral Target',    text: `Losing weight, ${name}. Fasting-driven fat loss disproportionately targets visceral fat — the metabolically active fat stored around organs that drives insulin resistance, inflammation, and chronic disease. The most important fat to lose.` },
        { title: '⚖️ Celebrate the Drop', text: `${Math.abs(diff)} lbs down, ${name}. Every pound is a vote your body has cast for the new program. The biology is responding. Keep giving it reasons to keep going.` },
      ]));
    } else if (diff > 1) {
      pool.push(pick([
        { title: '⚖️ Weight Check',       text: `The scale has moved up slightly. This could be muscle gain, water retention, or eating window timing. Look at sleep and stress scores — they're often the real driver.` },
        { title: '⚖️ Context Matters',    text: `A slight uptick in weight doesn't mean the fast isn't working, ${name}. Muscle is denser than fat, and stress or sodium can account for 2-3 lbs of water weight alone.` },
        { title: '⚖️ Look Beyond the Number', text: `Scale up a bit, ${name}. Check your hydration and stress levels first — both cause water retention. Your fasting consistency matters more than a short-term scale reading.` },
        { title: '⚖️ Recomposing',        text: `Scale up slightly, ${name}. If you're exercising, this is often muscle gain outpacing fat loss temporarily. Take body measurements — the tape measure tells a more accurate story than the scale during fasting.` },
        { title: '⚖️ Salt and Stress',    text: `Scale trending up, ${name}. Stress hormones (cortisol) cause significant water retention independently of fat. Check your stress scores — a high-stress week can add 2-4 lbs of temporary water weight with zero fat gain.` },
        { title: '⚖️ Investigate First',  text: `Weight up a bit, ${name}. Before drawing conclusions, check: did sleep quality drop? Did sodium intake increase? Did stress spike? These three factors account for most short-term scale increases.` },
      ]));
    } else {
      pool.push(pick([
        { title: '⚖️ Holding Steady',     text: `Your weight has been stable, ${name}. If loss is your goal, try tightening your eating window by 1 hour or cutting processed foods — small changes compound quickly with fasting.` },
        { title: '⚖️ Maintenance Mode',   text: `Weight stable. This could mean you've found your natural setpoint with your current protocol — or a sign to push the window slightly shorter for 2 weeks and reassess.` },
        { title: '⚖️ Stable Foundation',  text: `Consistent weight, ${name}. Stability is underrated — it means your fasting is matching your intake. Adjust one variable at a time to shift in the direction you want.` },
        { title: '⚖️ Plateau Intelligence', text: `Weight holding, ${name}. Plateaus are biological intelligence — your body defending a setpoint. The way through is usually one of three things: shorter eating window, improved sleep, or reduced processed food. Try one for 2 weeks.` },
        { title: '⚖️ Invisible Progress', text: `Scale steady, ${name}. Weight stability during fasting often masks body recomposition — fat decreasing and muscle increasing simultaneously. Take photos and measurements alongside the scale.` },
        { title: '⚖️ Next Variable',      text: `Weight stable, ${name}. You've found your equilibrium. To shift it, change one input deliberately — an hour shorter eating window, one extra glass of water, or eliminating a specific high-calorie habit.` },
      ]));
    }
  }

  // ================================================================
  //  TIME OF DAY
  // ================================================================
  if (hour >= 5 && hour < 10) {
    pool.push(pick([
      { title: '🌅 Morning Fast',         text: `Early check-in, ${name}. Morning fasting is powerful — cortisol peaks at dawn and naturally suppresses hunger. Your body is already primed for it.` },
      { title: '🌄 Dawn Advantage',       text: `Morning momentum is real. Starting your day without eating trains your metabolism to burn stored fuel first — the discipline at 7am pays off by noon.` },
      { title: '☀️ First Light Faster',   text: `Up early and fasting, ${name}. The metabolic advantage of morning fasting comes from cortisol and growth hormone naturally peaking overnight — you're riding a biological tailwind.` },
      { title: '🌅 Morning Clarity',      text: `Morning check-in, ${name}. The mental clarity of a fasted morning is one of the most consistently reported benefits across all fasting research. You're in it right now.` },
      { title: '🌄 Cortisol Aligned',     text: `Early morning fasting, ${name}. Your cortisol rhythm peaked about an hour after waking — this natural cortisol surge suppresses hunger, improves focus, and mobilizes fat. Your body is doing the work for you.` },
      { title: '☀️ Quiet Hours',          text: `Morning fast, ${name}. The early hours are when the fasting window is easiest — sleep keeps you occupied, cortisol suppresses hunger, and the day's demands haven't started pushing you toward food yet.` },
      { title: '🌅 Best Creative Window', text: `Fasted morning, ${name}. Ketones and low insulin create the brain state that many creatives, writers, and entrepreneurs deliberately cultivate. If you have important thinking to do — this is your window.` },
    ]));
  } else if (hour >= 21 || hour < 2) {
    pool.push(pick([
      { title: '🌙 Night Owl Faster',     text: `Checking in late, ${name}. Evening is when willpower is lowest — if you're in your fasting window right now, you're doing something most people can't.` },
      { title: '🌙 Closing Strong',       text: `Late night and still fasting — that's real discipline, ${name}. The kitchen is closed and you know it. Sleep is your final stretch.` },
      { title: '🌙 Night Mode',           text: `Late check-in, ${name}. Going to sleep in a fasted state lets your body lean fully into repair and autophagy overnight. You're setting up tomorrow's fast at the same time.` },
      { title: '🌙 Evening Warriors',     text: `Late-night fasting, ${name}. The evening is the hardest part of any fasting window — boredom, habit, social pressure. Making it here is a real win.` },
      { title: '🌙 Overnight Repair',     text: `Checking in late, ${name}. The next few hours of sleep in a fasted state are when growth hormone surges most dramatically — full, clean, systemwide repair. You're heading into it.` },
      { title: '🌙 Discipline Earned',    text: `Late night and fasting, ${name}. Evening hunger is the most socially and emotionally charged time to fast. The fact that you're here says something clear about your commitment.` },
      { title: '🌙 The Last Mile',        text: `Almost through the day, ${name}. Whatever fasting window you're in — you're in the final stretch. Sleep will carry you across. One of the most satisfying feelings: waking up with the fast still intact.` },
    ]));
  }

  // ================================================================
  //  GARDEN MILESTONES
  // ================================================================
  const plantCount = store.state.garden.plants.length;
  if (plantCount >= 20) {
    pool.push(pick([
      { title: '🌸 Thriving Garden',      text: `${plantCount} plants in your garden, ${name}. Each one is a fast you chose to finish. That visual record of discipline is more powerful than any number on a scale.` },
      { title: '🏡 Garden of Proof',      text: `${plantCount} plants earned. Your garden is a literal map of your commitment — every bloom represents a moment you chose long-term health over short-term comfort.` },
      { title: '🌺 Collection Blooming',  text: `${plantCount} species collected, ${name}. Your garden is becoming something rare. Most people never stick around long enough to see it look like this.` },
      { title: '🌿 Living Record',        text: `${plantCount} plants, ${name}. Your garden is a living record that can't be faked — every plant was earned by finishing a fast. It's the most honest document of your effort.` },
      { title: '🏡 What Consistency Looks Like', text: `${plantCount} plants in your garden, ${name}. This is what consistency looks like made visible. Each time you doubted yourself and kept going — there's a plant for that.` },
      { title: '🌸 Abundant Garden',      text: `${plantCount} plants, ${name}. Your garden is abundant. The rarer species you've collected represent fasts most people never attempt. They belong to you.` },
      { title: '🌺 Walking Your Talk',    text: `${plantCount} plants earned, ${name}. There's no other way to fill a garden except doing the work. You've walked your talk ${plantCount} times.` },
      { title: '🌿 Botanical Wealth',     text: `${plantCount} plant species, ${name}. What started as a single seed is now a collection that reflects weeks — potentially months — of deliberate practice. This is what compound effort looks like.` },
    ]));
  } else if (plantCount >= 5) {
    pool.push(pick([
      { title: '🌿 Garden Growing',       text: `${plantCount} plants collected — your garden is taking shape, ${name}. Every completed fast adds another one. Keep finishing strong.` },
      { title: '🌱 Filling In',           text: `${plantCount} plants in your garden. The rarer species unlock as you accumulate more fasts. Some of the best ones are still waiting.` },
      { title: '🌸 Early Garden',         text: `${plantCount} plants, ${name}. Your garden is in its early bloom. Each completed fast brings a new species. What it looks like in 30 more fasts is something to look forward to.` },
      { title: '🌺 Taking Shape',         text: `${plantCount} plants earned, ${name}. Your garden is taking on character. The empty spaces are not failures — they're invitations for the fasts still ahead.` },
      { title: '🌿 Growing Collection',   text: `${plantCount} plants, ${name}. A garden grows one plant at a time — your consistency is the only gardening tool that matters.` },
    ]));
  }

  // ================================================================
  //  UPCOMING MILESTONE NUDGE
  // ================================================================
  if (completed.length > 0) {
    const nextMilestones = [5, 10, 25, 50, 100];
    const next = nextMilestones.find(m => m > completed.length && m - completed.length <= 3);
    if (next) {
      const remaining = next - completed.length;
      pool.push(pick([
        { title: `🎯 ${remaining} Away from ${next}`,  text: `You're ${remaining} fast${remaining > 1 ? 's' : ''} away from ${next} completed, ${name}. That milestone is closer than it's ever been.` },
        { title: `🌱 Almost ${next} Fasts`,            text: `Just ${remaining} more and you hit ${next} completed fasts, ${name}. A milestone worth finishing strong for.` },
        { title: `🌺 ${next} Is Right There`,          text: `${remaining} fast${remaining > 1 ? 's' : ''} from ${next} completions, ${name}. Close. Keep going.` },
        { title: `🌿 ${next} Coming Up`,               text: `You're ${remaining} away from ${next} completed fasts, ${name}. Each milestone you cross makes the next one feel more inevitable.` },
        { title: `🏆 ${next} Fasts: Almost`,           text: `${remaining} more fast${remaining > 1 ? 's' : ''} and you join the ${next}-fast club, ${name}. That milestone will feel earned because it is.` },
        { title: `🌸 ${next} On the Horizon`,          text: `${next} completed fasts is ${remaining} fast${remaining > 1 ? 's' : ''} away, ${name}. Some milestones change how you see yourself. This might be one of them.` },
      ]));
    }
  }

  // ================================================================
  //  SCIENCE TRIVIA (fallback, 50 items, shuffled)
  // ================================================================
  const trivia = [
    { title: '🌸 Autophagy Window',       text: "Cellular cleanup (autophagy) activates around 12-16h and peaks at 24-48h. Every fast you complete advances that process." },
    { title: '🧬 Longevity Signal',        text: "Fasting activates SIRT1 genes linked to longevity and DNA repair. Think of each fast as sending a renewal signal to your cells." },
    { title: '🧠 Brain Bloom',             text: "BDNF — brain-derived neurotrophic factor — rises during fasting. It supports new neuron growth and is linked to sharper focus and better mood." },
    { title: '🌿 Gut Reset',              text: "During a fast your gut microbiome shifts. Beneficial bacteria thrive while harmful strains are starved — fasting is one of the most powerful gut health tools available." },
    { title: '🔥 Fat as Fuel',             text: "Once glycogen depletes around 12-16h, your body switches to burning fat. This metabolic switch is the core of fasting's body composition benefits." },
    { title: '💧 Salt During Fasting',     text: "Your kidneys excrete more sodium while fasting. A small pinch of sea salt in water helps maintain electrolyte balance and prevents the 'fasting headache.'" },
    { title: '🌙 Growth Hormone Surge',    text: "Human growth hormone increases significantly during extended fasting — GH preserves muscle mass, accelerates fat burning, and is fasting's most underappreciated mechanism." },
    { title: '🧠 Ketones & Clarity',       text: "Ketone bodies produced during fasting cross the blood-brain barrier and provide cleaner fuel than glucose — this is why many report sharper thinking after 16+ hours." },
    { title: '🌸 Inflammation Reset',      text: "Fasting lowers NF-κB, a key driver of chronic inflammation. Conditions linked to chronic inflammation — joint pain, brain fog, skin issues — often improve with consistent fasting." },
    { title: '⏰ Circadian Eating',        text: "Aligning your eating window with daylight hours amplifies every fasting benefit. The same calories eaten earlier produce measurably better metabolic outcomes than at night." },
    { title: '🫀 Heart Health',            text: "Regular fasting improves LDL particle size, lowers triglycerides, and reduces blood pressure independent of weight loss — cardiovascular benefits accumulate from week one." },
    { title: '🌿 The Cleaning Cycle',      text: "Your gut runs a 'cleaning cycle' every 90 minutes — but only 4+ hours after eating. Fasting lets this repair mechanism complete its full run." },
    { title: '🧬 Insulin Sensitivity',     text: "Every fasting window lowers baseline insulin. Over weeks, this improves insulin sensitivity — your cells respond better to glucose, reducing fat storage and energy crashes." },
    { title: '🌊 Metabolic Flexibility',   text: "A metabolically flexible person switches smoothly between burning glucose and fat. Fasting is the single most effective training tool for building this flexibility." },
    { title: '🌙 Melatonin & Fasting',     text: "Eating late suppresses melatonin and disrupts circadian rhythm. Closing your eating window early protects your sleep chemistry and amplifies overnight recovery." },
    { title: '🔬 mTOR & Repair',          text: "Fasting downregulates mTOR — a cellular growth pathway. In its dormant state, your cells switch from growing to repairing. A key mechanism behind fasting's anti-aging effects." },
    { title: '🧠 Cognitive Reserve',       text: "Research on intermittent fasting shows it increases cognitive reserve — the brain's resilience to stress and damage. Long-term fasters show slower cognitive decline with age." },
    { title: '🌸 Adiponectin Rise',        text: "Fasting raises adiponectin, a hormone that improves insulin sensitivity, reduces inflammation, and accelerates fat burning. It's one of the least known but most beneficial effects of fasting." },
    { title: '🌿 Stem Cell Activation',    text: "Extended fasting (24+ hours) has been shown to trigger stem cell regeneration in the gut lining — a powerful self-repair mechanism most people's digestive systems never get to run." },
    { title: '🔥 Thermic Efficiency',      text: "When you eat, your body burns 10-30% of the calories you consume just digesting them. During fasting, that energy is redirected — more is available for repair and performance." },
    { title: '🧬 Epigenetic Changes',      text: "Consistent fasting produces epigenetic changes — modifications to gene expression — that favor fat burning, inflammation reduction, and cellular longevity. These changes persist even on non-fasting days." },
    { title: '🌊 Lymphatic Flow',          text: "Physical movement during fasting enhances lymphatic drainage — the body's waste removal system. A 20-minute walk during your fasting window accelerates detox as meaningfully as anything else." },
    { title: '🌙 Core Temperature',        text: "Your core temperature needs to drop 1-2°C to enter deep sleep. Fasting before bed accelerates this cooling process — metabolic activity drops with food digestion gone, and sleep onset improves." },
    { title: '🫀 Cholesterol Remodel',     text: "Fasting remodels cholesterol composition — specifically increasing large, buoyant LDL particles (less harmful) while decreasing small, dense ones (more harmful). Your cardiac risk profile improves measurably." },
    { title: '🧠 Default Mode Network',    text: "During fasting, the brain's Default Mode Network — responsible for creativity, introspection, and self-referential thinking — becomes more active. The 'fasting focus' people describe is partly this." },
    { title: '🌿 Microbiome Diversity',    text: "Short-term fasting increases gut microbiome diversity — a key marker of gut health. Each fasting window is a selection event that favors beneficial species over harmful ones." },
    { title: '🔬 Sirtuins',               text: "Fasting activates sirtuins — a family of proteins that regulate cellular health, DNA repair, and metabolic efficiency. Sirtuins are among the most studied longevity mechanisms in current research." },
    { title: '🌸 Skin Turnover',           text: "Autophagy during fasting clears damaged cellular components including those in skin cells. Many long-term fasters report improved skin clarity — this is the likely biological mechanism." },
    { title: '🌊 Blood Pressure',          text: "Consistent intermittent fasting produces clinically significant reductions in systolic blood pressure in most studies — comparable to some medications, without side effects." },
    { title: '🌙 Melatonin Production',    text: "Melatonin is suppressed by eating. The earlier you close your eating window, the longer and more reliably melatonin rises — improving sleep quality from the inside out." },
    { title: '🔥 Brown Fat Activation',    text: "Fasting activates brown adipose tissue — a type of fat that burns energy to generate heat. Brown fat activation improves insulin sensitivity and metabolic rate." },
    { title: '🧬 Telomere Length',         text: "Chronic inflammation accelerates telomere shortening — a key aging mechanism. Fasting's anti-inflammatory effects may slow this process, adding to the growing evidence for its longevity benefits." },
    { title: '🌿 Digestive Rest',          text: "Your digestive system never fully rests when you eat every 4-6 hours. Fasting gives it the genuine rest it needs to repair the gut lining, reduce leaky gut, and restore optimal function." },
    { title: '🧠 Neuroprotection',         text: "Fasting promotes the production of ketones, which provide neuroprotective effects — reducing oxidative stress in neurons and supporting the brain against the damage that accumulates with age." },
    { title: '🌸 Hormetic Stress',         text: "Fasting is a hormetic stressor — mild stress that makes the system stronger. Like exercise, the temporary discomfort of fasting triggers biological adaptations that far outlast the stress itself." },
    { title: '🌊 Interleukin-6 Drop',      text: "IL-6 and other pro-inflammatory cytokines drop significantly during fasting. For people with chronic inflammatory conditions, this measurable drop often produces noticeable symptom relief." },
    { title: '🔬 Mitophagy',              text: "Beyond autophagy, fasting triggers mitophagy — the clearance of damaged mitochondria. Removing dysfunctional mitochondria is how fasting improves energy production at the cellular level." },
    { title: '🌙 Leptin Reset',            text: "Leptin — the satiety hormone — becomes dysregulated from chronic overeating. Fasting resets leptin sensitivity, meaning your brain responds more accurately to fullness signals. Food becomes less compulsive." },
    { title: '🌿 Ghrelin Adaptation',      text: "Ghrelin — your hunger hormone — follows a clock, not your actual nutritional needs. After 2-3 weeks of consistent fasting timing, ghrelin peaks shift to align with your eating window. Hunger becomes predictable and manageable." },
    { title: '🧬 Cellular Senescence',     text: "Autophagy during fasting clears senescent cells — 'zombie cells' that no longer function but remain in tissue, releasing inflammatory signals. Clearing them is one of the most direct anti-aging mechanisms available." },
    { title: '🌸 Mental Health Signal',    text: "Research increasingly links consistent fasting with reduced symptoms of anxiety and depression. The mechanisms include reduced inflammation, improved gut microbiome, and more stable blood sugar — all mood stabilizers." },
    { title: '🌊 Triglyceride Clearance',  text: "Fasting windows give the body time to clear blood triglycerides completely between meals. Chronically elevated triglycerides — common with frequent eating — are a leading risk factor for heart disease." },
    { title: '🔥 Glycogen Math',           text: "Your liver stores roughly 100g of glycogen, your muscles about 400g. At rest you burn about 10g per hour. At 16 hours of fasting, you're reliably past glycogen depletion and into fat burning." },
    { title: '🌿 Liver Detox',             text: "Between meals — especially during fasting — your liver performs glycogen clearance, ketone production, cholesterol regulation, and toxin processing. Extended fasting gives it uninterrupted time to complete all of it." },
    { title: '🧠 Focus Chemistry',         text: "During fasting, norepinephrine rises. This catecholamine increases alertness, focus, and reaction time — which is why many people do their best cognitive work during a fasting window." },
    { title: '🌸 Collagen & Fasting',      text: "Growth hormone, elevated during fasting, stimulates collagen synthesis. This is a likely contributor to the improved skin elasticity and joint health reported by long-term fasters." },
    { title: '🌊 Blood Sugar Stability',   text: "One of the most immediate benefits of fasting is blood sugar stabilization. Without constant food input, glucose stops spiking and crashing — and with it, the mood swings, cravings, and energy crashes that follow blood sugar volatility." },
    { title: '🔬 Immune Reprogramming',    text: "Prolonged fasting followed by refeeding triggers a cycle of immune cell die-off and regeneration. Over time, this 'reprogramming' is associated with reduced autoimmune markers and improved immune function." },
    { title: '🌙 Chronobiology',           text: "Your body runs on roughly 24-hour cycles that govern metabolism, immunity, and repair. Eating at consistent times — and fasting at consistent times — aligns these cycles for maximum biological efficiency." },
    { title: '🌿 Gut Barrier',             text: "The gut epithelium — the barrier between your gut contents and your bloodstream — regenerates during fasting. Leaky gut symptoms often improve with consistent fasting as this barrier is given time to repair." },
    { title: '🧬 Gene Expression',         text: "Within hours of beginning a fast, your body shifts the expression of thousands of genes — switching from growth and energy storage toward repair, fat burning, and stress resistance. You're literally changing which programs your cells are running." },
  ];

  return { pool, trivia };
}
