export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  image: string;
  category: string;
  sections: { heading?: string; content: string }[];
}

export const blogs: BlogPost[] = [
  {
    slug: "why-toddlers-get-hangry",
    title: "Why Toddlers Get 'Hangry'",
    excerpt:
      "Explore the science behind toddler mood swings tied to hunger — and what parents can do to prevent meltdowns before they start.",
    date: "Feb 10, 2026",
    readTime: "5 min read",
    image: "/marketing-assets/blog-hangry-toddler.jpg",
    category: "Nutrition",
    sections: [
      {
        content:
          "We've all seen it — a perfectly happy toddler turns into a tiny tornado the moment hunger strikes. Crying, tantrums, the works. Most parents chalk it up to being 'hangry,' but there's real science behind why young children are especially prone to mood crashes when they haven't eaten.",
      },
      {
        heading: "What Happens in Their Body",
        content:
          "When a toddler goes too long without food, their blood sugar drops. Unlike adults, young children have smaller glycogen reserves and faster metabolisms, which means their blood sugar can dip quickly. This triggers the release of stress hormones like cortisol and adrenaline — the same ones involved in the 'fight-or-flight' response. The result? Irritability, crying, and emotional outbursts that seem disproportionate to the situation.",
      },
      {
        heading: "The Brain-Hunger Connection",
        content:
          "A toddler's brain is growing rapidly and consumes a large share of their body's glucose supply. When fuel runs low, the prefrontal cortex — responsible for self-regulation and impulse control — is one of the first areas affected. That's why hungry toddlers don't just feel bad; they lose the ability to manage their emotions. They're not being difficult — their brain literally can't cope.",
      },
      {
        heading: "Why Toddlers Are More Vulnerable",
        content:
          "Several factors make toddlers especially susceptible to 'hanger':\n\n• **Small stomachs, big energy needs:** They can only eat small amounts at a time but burn through energy fast.\n• **Irregular eating patterns:** Toddlers are notorious for skipping meals or being too distracted to eat.\n• **Limited communication:** They can't always tell you they're hungry, so frustration builds before anyone notices.\n• **Developing emotional regulation:** Even when well-fed, toddlers are still learning to manage big feelings — hunger makes it harder.",
      },
      {
        heading: "What Parents Can Do",
        content:
          "The good news is that 'hanger' is preventable with a few simple strategies:\n\n• **Offer regular snacks:** Don't rely on three big meals. Small, frequent snacks (every 2–3 hours) keep blood sugar steady.\n• **Choose slow-release foods:** Pair complex carbs with protein or healthy fats — think banana with peanut butter, cheese with whole-grain crackers, or yoghurt with oats.\n• **Watch for early signs:** Restlessness, whining, or loss of focus can signal hunger before a full meltdown hits.\n• **Keep snacks accessible:** Have portable options ready for outings — trail mix, fruit pouches, or veggie sticks.\n• **Model calm eating habits:** Children mirror what they see. Regular, relaxed family meals set a positive tone.",
      },
      {
        heading: "The Bottom Line",
        content:
          "When your toddler melts down before lunch, it's not bad behaviour — it's biology. Their bodies and brains are wired to react strongly to drops in blood sugar. Understanding the 'hangry' response helps parents respond with empathy instead of frustration, and with smart snacking strategies instead of power struggles.",
      },
    ],
  },
  {
    slug: "gut-issues-toddlers",
    title:
      "Constipation, Picky Eating & Power Struggles: What Your Toddler's Gut Is Trying to Say",
    excerpt:
      "Meals at home might turn into small wars. Hidden beneath the surface is something quiet: your child's stomach doing unspoken work.",
    date: "Feb 10, 2026",
    readTime: "6 min read",
    image: "/marketing-assets/blog-gut-health.jpg",
    category: "Gut Health",
    sections: [
      {
        content:
          "Meals at home might turn into small wars instead of shared times — with refusals, crying, even silent clashes near the broccoli. It's common, hidden beneath the surface is something quiet: your child's stomach doing unspoken work.\n\nWhen a kid resists food, gets upset during meals, or struggles to go regularly, it often points to more than just habits. Their body might be signaling deeper imbalance — something inside isn't flowing smoothly.",
      },
      {
        heading: "The Gut Story: When Things Slow Down",
        content:
          "Down in your child's stomach, something starts moving after eating. A system of narrow tubes forms the path food takes next. Movement along this route happens by small muscle contractions — this is what people mean by gut motility.\n\nWhen little ones drink less water, eat minimal fibre, or fill up on too many packaged meals, their body coils move more slowly. That leads to constipation — bringing discomfort, bloating, and irritability along.\n\nA kid linking meals to discomfort often stops eating altogether. Out of nowhere, you face one who won't try new things — a shield, more than a choice.",
      },
      {
        heading: "Fibre: Finding the Balance",
        content:
          "Fibre works well for gut health. Stools become heavier because of it, also helping them pass through more easily. Yet too little or too much throws things off. Finding the middle ground keeps things running smoothly.\n\nFibre works best when there's enough fluid around. It acts like a sponge inside the gut, requiring moisture to swell naturally.\n\n**Aim for:**\n• Fruits kept whole, skin included, whenever possible\n• Oats, brown rice, and whole wheat pasta\n• Veggies — pureed, turned into soups, or served as crispy sticks\n• Plenty of water throughout the day",
      },
      {
        heading: "The Stress Connection: When Mealtime Becomes a Battle",
        content:
          "This might catch you off guard: when stressed, digestion actually slows down.\n\nA small cry can rise when dinner feels like a test. Pressure to eat triggers tension. The room tightens. Faster breathing pushes more toward the lungs, yet each breath holds less air. This loop keeps tightening.\n\nWhen the tummy hurts, meals often become limited. Caregivers tend to push for wider food choices. That extra pressure adds strain. A slower gut reaction follows, which tends to worsen discomfort.\n\nBreak it down like this: connect more than you try to control. Share meals, show joy while eating, and let your child discover different foods in their own time. When the body feels calm, digestion improves.",
      },
      {
        heading: "Parent-Friendly Steps",
        content:
          "• Offer small portions of high-fibre foods throughout the day\n• Slip fresh picks into dishes they already like — pasta with broccoli and melted cheese\n• Encourage drinking between meals\n• Keep mealtimes quiet, low-key, no rush\n• Move your body — dancing, short walks, even playtime gets things moving in the gut\n• A handful more of outside time might shift how things feel",
      },
      {
        heading: "The Bottom Line",
        content:
          "When kids are little, their gut feelings tie closely to how they feel inside. Slow bowel movements aren't only about digestion — they can hint at inner shifts, like a quiet call for steadiness.\n\nFlow changes happen when fibre, drinks, and emotions shift into balance. This quiet turn supports how your child's gut works — along with their inner strength — to return smooth and steady.",
      },
    ],
  },
  {
    slug: "separation-anxiety-appetite",
    title:
      "Separation Anxiety & Poor Appetite: Is the Nervous System Involved?",
    excerpt:
      "When young kids feel separation anxiety, it doesn't just tug at their hearts — their stomachs react too. Stress, the vagus nerve, and food all play a role.",
    date: "Feb 10, 2026",
    readTime: "7 min read",
    image: "/marketing-assets/blog-separation-anxiety.jpg",
    category: "Psychology",
    sections: [
      {
        content:
          "You drop your child off at daycare, and suddenly those big eyes well up with tears. They cling to you, skip breakfast, and when you pick them up later, you notice they've barely touched their food. It's tempting to shrug it off as \"picky eating\" or just another phase. But sometimes, it's not about the food at all — it's their nervous system calling the shots.",
      },
      {
        heading: "Here's What's Going On Inside",
        content:
          "The gut and brain are in constant conversation, thanks to the vagus nerve — this direct line helps the body flip between \"fight-or-flight\" and \"rest-and-digest.\" When a child feels anxious, like when you say goodbye at daycare, their body hits the stress button. The heart beats faster, breathing speeds up, and digestion takes a back seat.\n\nSuddenly, food just isn't appealing. Maybe they lose their appetite, complain about tummy aches, or flat-out refuse to eat when they're upset. It's not stubbornness — it's biology. If the vagus nerve isn't sending those \"all clear\" signals, eating can actually feel bad.",
      },
      {
        heading: "The Role of Attachment",
        content:
          "A lot of this comes back to attachment — that close emotional bond kids build with their caregivers. Through these relationships, kids figure out if the world is safe or not. Eating actually requires you to feel calm and settled, so if a child feels stressed, uncertain, or away from the people who make them feel secure, eating gets hard.\n\nFor little kids, feeling safe is as crucial as a meal. When transitions feel rushed or tense, their hunger takes a back seat until things calm down. That's a big reason why your kid might eat just fine at home but barely touch their lunch at daycare. Pushing food doesn't really fix it — connection does.",
      },
      {
        heading: "Vagal Tone & Resilience",
        content:
          "The flexibility of that vagus nerve makes a difference. Kids with higher vagal tone can bounce back from stress faster. Maybe they cry when you leave, but they're back at the snack table ten minutes later.\n\nYou can help build this resilience with simple, sensory routines:\n• Take deep breaths together (\"Smell the flower, blow out the candle\")\n• Sing or hum (that vibration soothes the nerves)\n• Offer hugs or gentle back rubs\n• Go for a slow walk outside\n\nThese little moments help digestion kick back in and bring back their appetite.",
      },
      {
        heading: "Comforting Foods That Help",
        content:
          "Food itself can help too. Think warm, soft, familiar meals that feel comforting and safe:\n\n• **Bananas** — gentle on the stomach and full of magnesium\n• **Warm porridge or rice bowls** — grounding and easy to digest\n• **Smooth soups** like lentil or pumpkin — go down easy\n• **Milk or yoghurt** — comforting texture and steady energy\n• **Avocado toast** — creamy fats that keep blood sugar steady\n\nWhen your child's stressed, it's not the time to introduce new foods or unfamiliar textures — familiar favourites help rebuild their appetite and sense of safety.",
      },
      {
        heading: "The Bottom Line",
        content:
          "When your little one refuses food during tough goodbyes, remember — they're not being \"difficult.\" Their nervous system is just trying to protect them.\n\n• When attachment feels secure, the nervous system calms.\n• When the nervous system calms, digestion resumes.\n• And only then does a child feel ready to eat.\n\nInstead of pushing another bite, offer your presence: a gentle cuddle, a calm voice, a slow breath. Once their heart feels safe, their stomach usually catches up.",
      },
    ],
  },
  {
    slug: "teen-anxiety-acne-nutrition",
    title: "Anxiety, Acne, Weight Gain, or Fatigue in Teens: What Nutrition Has to Do With It",
    excerpt:
      "When anxiety comes with breakouts, constant fatigue, or unexpected weight changes, don't just blame hormones. There's more happening beneath the surface.",
    date: "Mar 1, 2026",
    readTime: "7 min read",
    image: "/marketing-assets/blog-teen-anxiety-nutrition.jpg",
    category: "Teen Health",
    sections: [
      {
        content:
          "Teen anxiety isn't just \"overthinking\" or being dramatic. It affects the whole body—brain, nerves, hormones, and even diet can play a role.\n\nThe teenage years are tough on the brain. The amygdala, which handles emotions, is in overdrive. Meanwhile, the prefrontal cortex—the part in charge of reasoning and self-control—is still developing. This means teens feel emotions intensely and can't always calm themselves down.\n\nAdd in school stress, comparing themselves to friends, lack of sleep, missed meals, and anxiety has the perfect environment to grow.",
      },
      {
        heading: "What's Going On Inside",
        content:
          "Stress hormones like cortisol and adrenaline flood the body. The heart beats faster, and breathing becomes shallow. Muscles get tense, and the stomach slows down. The brain stays on high alert, always watching for threats.\n\nThat's why anxious teens often feel jittery and restless. They can't stop fixating on small problems. Sleep becomes difficult. Headaches, nausea, and stomach aches appear without warning. They feel both drained and on edge at the same time.",
      },
      {
        heading: "Blood Sugar: The Hidden Mood Wrecker",
        content:
          "Every meal kicks off a whole chain reaction inside the body. If breakfast is all sugar, or snacks are nothing but carbs and energy drinks, blood sugar shoots up fast—then crashes just as hard. That crash sets off stress hormones like cortisol and adrenaline. Suddenly, your teen is irritable, anxious, jittery, reaching for more sugar, and struggling to focus in class.\n\nKeep this rollercoaster going, and the body starts storing more fat, especially around the belly. But balanced meals—think protein (like eggs, yoghurt, or lentils), healthy fats (avocado, nuts, olive oil), and fibre (whole grains, veggies, fruit skins)—keep energy and mood steadier.",
      },
      {
        heading: "Inflammation: The Sneaky Source of Acne and Tiredness",
        content:
          "Repeated blood sugar spikes light little fires of inflammation all over the body. You might see it as acne, bloating, or just being tired all the time. Junk food and sugary drinks feed that inflammation. Foods rich in omega-3s (fish, chia, flax), zinc (pumpkin seeds, seafood), and vitamin E (nuts, spinach) help put out those fires, naturally calming skin, balancing hormones, and cutting down on breakouts.\n\nAnd if inflammation sticks around, it starts messing with how the body handles insulin, which can mean even more acne and weight gain.",
      },
      {
        heading: "Micronutrient Gaps: The Quiet Energy Thief",
        content:
          "Teens are growing fast, so they need more nutrients for every calorie than adults. Most of them just don't get enough. Iron? If it's low, so is energy and focus. B vitamins? Without them, moods swing and concentration tanks. Magnesium? When it's missing, anxiety and muscle tension show up. Vitamin D and zinc? The skin and immune system take a hit.\n\nNo need for miracle supplements. Just go for real, colourful foods: orange stuff like sweet potatoes and mango for vitamin A, greens like broccoli and spinach for magnesium and folate, and protein-rich foods for B12, zinc, and iron.",
      },
      {
        heading: "What the Body's Trying to Say",
        content:
          "When things are out of whack, the body sends signals:\n\n• **Acne** usually means inflammation and blood sugar spikes.\n• **Anxiety** often points to low blood sugar or not enough B vitamins.\n• **Fatigue** could be missing iron or magnesium.\n• **Weight gain** is often a cortisol and insulin thing.\n\nFood won't fix everything, but it lays the groundwork. Good nutrition doesn't just shape the body—it calms the nervous system, too.",
      },
      {
        heading: "The Bottom Line",
        content:
          "Anxiety, acne, tiredness, and weight issues tend to show up together because they're all tied to the same root causes: inflammation and imbalance. Teens don't need strict diets or endless rules—they need a steady routine. Fill in those nutrient gaps, keep blood sugar level, and everything else starts to fall into place. Hormones settle, skin clears, energy returns, and moods feel more even. It's not about restriction. It's about feeding real balance back into their lives.",
      },
    ],
  },
  {
    slug: "teen-dieting-stress-response",
    title: "Dieting, Skipping Meals, and the Teenage Stress Response: Hidden Metabolic Consequences",
    excerpt:
      "Your teen decides to 'eat clean' or starts skipping lunch to feel in control. But it doesn't take long before the changes show — cranky, tired, crashing by midday.",
    date: "Mar 1, 2026",
    readTime: "8 min read",
    image: "/marketing-assets/blog-teen-dieting-stress.jpg",
    category: "Teen Health",
    sections: [
      {
        content:
          "Your teen decides to \"eat clean\" or starts skipping lunch to feel in control or to fit in. At first, it doesn't seem like a big deal. But it doesn't take long before you notice the changes—suddenly they're cranky or tired all the time. They complain about being cold, their skin looks dull, and halfway through the day, they just crash.\n\nWhen teens start cutting calories or skipping meals, it's not just about eating less. Their bodies react—fast. The stress response kicks in behind the scenes. Cortisol, the main stress hormone, starts to rise. Metabolism slows down. The body flips into energy-saving mode, almost like it thinks there's a famine.",
      },
      {
        heading: "Stress and Metabolism: A Two-Way Street",
        content:
          "When the brain gets the message that food is scarce, it flips an old survival switch. The HPA axis jumps into action and pumps out cortisol. In the short term, cortisol helps by raising blood sugar and keeping you alert. But if skipping meals becomes a regular thing, cortisol stays high. That tells the body to slow down metabolism, hold onto fat, and even break down muscle for energy.\n\nThat's why strict dieting can bring on things like:\n• Tiredness and feeling cold all the time\n• Mood swings or lots of anxiety\n• Irregular periods for girls\n• Slower growth and sluggish recovery after exercise",
      },
      {
        heading: "The Hidden Price of Skipping Meals",
        content:
          "Skipping breakfast or lunch might look like willpower, but it actually trains the body to expect less food. In response, a bunch of things change:\n\n• Thyroid hormones (T3, T4) dip, so metabolism slows down\n• Leptin, the hormone that helps you feel full, drops—so teens are more likely to overeat later\n• Ghrelin, the hunger hormone, shoots up—cue cravings and possible bingeing\n• Blood sugar swings up and down, leading to irritability and that classic \"brain fog\"",
      },
      {
        heading: "Cortisol: The Quiet Troublemaker",
        content:
          "Cortisol's great when you're running from a bear, but not so great when it stays high because of dieting or stress. Chronically elevated cortisol does stuff like:\n\n• Spike and crash blood sugar\n• Push the body to store more belly fat\n• Weaken the immune system\n• Mess with sleep and ramp up anxiety\n\nPlus, high cortisol competes with other hormones. It can drag down estrogen, testosterone, and thyroid function. No wonder teens under constant food stress feel wiped out, moody, or just emotionally flat.",
      },
      {
        heading: "The Diet-Anxiety Loop",
        content:
          "Dieting isn't just tough on the body—it messes with the mind, too. When blood sugar tanks, the brain fires off more adrenaline and cortisol, which feels a lot like anxiety: racing heart, dizziness, irritability, maybe even panic. Teens might think they're just \"emotional,\" but really, it's their body's hunger-stress alarm going off. So they double down, eat even less, and the cycle gets deeper.",
      },
      {
        heading: "How to Help Teens Rebuild Balance",
        content:
          "Start with a real breakfast—something with protein, healthy fats, and complex carbs—to steady cortisol and set the tone for the day. Eating every 3–4 hours keeps blood sugar level and the nervous system calm. Hydration matters, too.\n\nMake sure they're getting iron and B-rich foods (think eggs, lean meat, lentils, leafy greens), plus omega-3s and healthy fats like salmon, avocado, and nuts to fight inflammation and hormone chaos. Rest and nourishment beat calorie counting every time—teens need food and sleep, not more restriction.",
      },
      {
        heading: "The Takeaway",
        content:
          "Dieting and skipping meals don't make teens healthier. They tell the body it's in danger. When the brain senses stress or not enough food, it hits the brakes on metabolism, pumps out more cortisol, and burns through the nutrients teens need to grow and focus. What really builds a strong, healthy metabolism? Balanced meals, nutrient variety, and learning to handle stress. Thriving teens don't need less food—they need more stability, more nourishment, and way more calm.",
      },
    ],
  },
  {
    slug: "early-morning-meltdowns-blood-sugar",
    title: "Early Morning Meltdowns: When Blood Sugar Drops Before Breakfast",
    excerpt:
      "It's 7 a.m. and your toddler's already wailing. The shoes are all wrong. The cereal feels like gravel. Those early morning meltdowns? They're about biology.",
    date: "Mar 1, 2026",
    readTime: "5 min read",
    image: "/marketing-assets/blog-morning-meltdowns.jpg",
    category: "Nutrition",
    sections: [
      {
        content:
          "It's 7 a.m. The sun's barely up, coffee's going, and your toddler's already wailing. The shoes are all wrong. The cereal feels like gravel. A hug just doesn't do it. You pause and think, \"Why do mornings have to be such a battle?\"\n\nHere's the thing: your kid's blood sugar probably tanked overnight. Their brain wakes up running on empty. So those early morning meltdowns? They aren't just about being fussy—they're about biology.",
      },
      {
        heading: "What Happens Overnight",
        content:
          "Even when your child's asleep, their body's working hard. The brain is busy—growing, dreaming, fixing things up—and it burns through glucose the whole time.\n\nToddlers and preschoolers run through their energy stores faster than adults. After 10 or 12 hours without food, their blood sugar drops. That's when cortisol and adrenaline show up—the body's way of shouting, \"Wake up!\" and \"We need fuel!\"\n\nSo in the morning you get:\n• Irritability\n• No patience\n• Craving for sugary stuff\n• Those tantrums? That's just your kid's brain waving a red flag—\"Feed me!\"",
      },
      {
        heading: "Bedtime Snacks: Why They Matter",
        content:
          "The trick is to keep their blood sugar steady overnight so it doesn't crash by morning. A balanced bedtime snack—think carbs, protein, and healthy fat—can really help.\n\nTry these about half an hour before bed:\n• Oatmeal with milk and chia seeds\n• Apple slices and nut butter\n• Whole-grain crackers with cheese\n• Banana with some Greek yogurt\n• A little warm milk and a whole-grain cookie\n\nThese snacks give a slow, steady release of energy, so blood sugar doesn't spike and crash. Come morning, things just go smoother.",
      },
      {
        heading: "Starting the Morning Right",
        content:
          "When kids wake up, their brains are desperate for glucose. What you give them first thing can set their mood for hours.\n\nSkip the sugar rush. Go for breakfast with balance:\n• Scrambled eggs, whole-grain toast, and fruit\n• Oatmeal with milk, some nuts, and berries\n• Whole-grain pancakes with yogurt\n• Smoothie with banana, spinach, oats, and nut butter\n\nThat mix of protein, fiber, and fat keeps energy steady and helps avoid the crash that follows a sugary breakfast.",
      },
      {
        heading: "Setting Up for Calm Mornings",
        content:
          "Calm mornings start the night before. Along with that snack:\n• Keep the bedtime routine peaceful—stress raises cortisol, which messes with blood sugar.\n• Make sure they're hydrated—waking up dehydrated can make kids grumpier.\n• Don't let dinner be too early—if your kid eats at 5, they'll be starving by sunrise.\n• A well-fed, calm body sleeps better and wakes up happier.",
      },
      {
        heading: "The Bottom Line",
        content:
          "Those rough mornings? They're usually not about attitude. They're about blood sugar hitting rock bottom after a long night. A good bedtime snack and a balanced breakfast help even things out. You're not just feeding them—you're giving their metabolism (and their mood) a fighting chance. So next time your toddler melts down before you've even had coffee, remember: a little snack before bed can make all the difference when the sun comes up.",
      },
    ],
  },
  {
    slug: "emotional-outbursts-after-school",
    title: "Emotional Outbursts After School: How Stress, Hunger, and Blood Sugar Collide",
    excerpt:
      "The school bell rings, backpacks hit the floor, and pretty soon that happy kid you picked up is falling apart. It's not about bad behavior — it's pure biology.",
    date: "Mar 1, 2026",
    readTime: "6 min read",
    image: "/marketing-assets/blog-afterschool-outbursts.jpg",
    category: "Child Wellness",
    sections: [
      {
        content:
          "The school bell rings, backpacks hit the floor, and pretty soon that happy kid you picked up is falling apart—tears, yelling, the works. You ask what's wrong, but they can't say. They're just wiped out.\n\nHonestly, this isn't about bad behavior. It's pure biology and burnout. After hours of sitting still, learning, and keeping their cool, their blood sugar tanks, stress hormones take over, and their brain flips from focused to fried.",
      },
      {
        heading: "The Crash: What's Happening Between 3 and 5 p.m.",
        content:
          "All day, kids pour out mental energy—paying attention, following rules, dealing with their feelings, and figuring out how to fit in. By the time you pick them up, three things have usually happened:\n\n• Their blood sugar has hit rock bottom. The brain's out of fuel.\n• Stress hormones like cortisol and adrenaline are sky high.\n• Their emotional control is running on empty, so every little thing feels huge.\n\nPut it all together, and you get what parents call the \"after-school restraint collapse\"—that total emotional dump kids have once they feel safe at home. It's not defiance. It's just recovery.",
      },
      {
        heading: "The Snack Connection: Why Timing Matters",
        content:
          "When kids come home hungry and strung out, their brains want sugar fast. But if you hand them cookies, chips, or juice, they'll spike and crash all over again. What they really need is a snack that eases them back to balance.\n\nTry giving them a snack within 15 or 20 minutes after you walk in the door:\n• Apple slices with peanut or almond butter\n• Whole-grain crackers with cheese\n• Mini egg muffins or a boiled egg with fruit\n• Banana and yogurt\n• Oats with milk and chia seeds\n\nThese mix carbs, protein, and healthy fats. Quick energy, plus staying power. Their brain gets what it needs, and you might avoid a meltdown before dinner.",
      },
      {
        heading: "Resetting the Nervous System: From Wired to Calm",
        content:
          "After a whole day of stimulation, your kid's in fight-or-flight mode. To bring them back to calm, you want to wake up the vagus nerve—that's the body's natural \"chill out\" button.\n\nSet up a simple 10–15-minute after-school routine:\n• Quiet snack time—dim the lights, skip the screens, maybe play some soft music.\n• Connection—share a hug, chat about nothing, or just sit together.\n• Move—let them swing, bounce, walk, or stretch.\n• Offer something warm—milk or caffeine-free tea can actually lower stress hormones.\n\nThink of it as \"emotional decompression.\" Their nervous system gets to recharge, and you both get a breather.",
      },
      {
        heading: "The Bigger Picture: Stopping the Daily Crash",
        content:
          "Want calmer afternoons every day?\n\n• Pack a protein-heavy lunch so they don't crash later.\n• Keep a water bottle handy—dehydration just makes things worse.\n• Stick to a regular bedtime. Tired kids unravel faster.\n• Give them a break. They hold it together all day and fall apart where they feel safe.",
      },
      {
        heading: "The Bottom Line",
        content:
          "Those after-school meltdowns aren't about attitude. It's energy and emotion, plain and simple. A good snack and a few quiet minutes can turn a disaster into a moment of connection. So next time your kid melts down after school, just remember: \"It's not misbehaviour—it's biology.\" Pass them a snack, not a lecture.",
      },
    ],
  },
  {
    slug: "preschooler-balance-nutrition",
    title: "Frequent Falls, Poor Balance, or Clumsiness in Preschoolers: Could Nutrition and Sensory Integration Be Linked?",
    excerpt:
      "When preschoolers trip a lot or seem wobbly, it might suggest something's going on with their diet, nerve development, or how their senses are working together.",
    date: "Mar 1, 2026",
    readTime: "7 min read",
    image: "/marketing-assets/blog-preschool-balance.jpg",
    category: "Child Development",
    sections: [
      {
        content:
          "It's amazing how much energy preschoolers have, always running, hopping, and twirling around! But sometimes, you might notice them tripping or stumbling more than you'd expect. They bump into stuff by accident or just seem to have trouble staying steady.\n\nKids often trip and fall when they're little, which is usually no big deal. But if a child is falling a lot or seems really clumsy, it might suggest there's something going on with their diet, how their nerves and muscles are growing, or how their senses are working together.",
      },
      {
        heading: "How Balance Actually Works",
        content:
          "When you're trying to stay balanced and coordinate your movements, it's not just your muscles doing all the work. It's actually a partnership between your brain, the nerves that send messages, your muscles, and all those sensory inputs—like touch, movement, and spatial awareness. For these systems to talk to each other without hiccups, your nerves need to send quick, clear signals.\n\nThat's where B vitamins and iron are super important:\n• **B1 (Thiamine), B6, and B12** are all really important for helping your nerves send signals and for keeping muscles working together smoothly.\n• **Iron** helps get oxygen where it needs to go—to your muscles and your brain. That means better focus and more controlled movement.\n\nWhen you're low on these nutrients, it's like a bad phone signal between your brain and your body.",
      },
      {
        heading: "Key Nutrients for Motor Development",
        content:
          "Here's how key nutrients support balance and strength:\n\n• **Vitamin B1 (Thiamine)** — helps nerves talk to each other and keeps muscles working right. Found in whole grains, beans, peas, and nuts.\n• **Vitamin B6** — keeps brain chemicals balanced, good for movement and mood. Found in chicken, fish, potatoes, and bananas.\n• **Vitamin B12** — helps build myelin, the insulation for nerves. Found in eggs, dairy products, and meats.\n• **Iron** — gets oxygen to muscles and brain. Found in red meat, lentils, spinach, and iron-fortified cereals.\n• **Magnesium** — helps muscles relax and nerves fire properly. Found in almonds, avocados, and oats.",
      },
      {
        heading: "Sensory Integration: The Missing Link",
        content:
          "Some little kids have a tough time with their senses—their brains can't sort out all the information coming in. When kids have trouble understanding what their body is feeling—like touch, movement, or where they are in space—they might seem clumsy or not want to move around much.\n\nEating certain foods won't cause sensory issues, but nutrition can make them worse or help calm them down. Eating the right foods helps kids focus better, build stronger muscles, and keep their energy levels steady, which can really support the sensory therapies they might be getting.",
      },
      {
        heading: "Practical Steps for Parents",
        content:
          "Things like crawling, climbing, and balancing games really help kids learn about their bodies and feel more confident when they move.\n\nSimple nutrition tweaks that make a difference:\n• Start the day with protein—eggs, yogurt, or nut butter—for steady energy\n• Eat foods with iron and B vitamins every day for nerves and muscles\n• Pair iron-rich foods with Vitamin C to help absorption\n• Stay hydrated—it's important for muscles and nerves to work right",
      },
      {
        heading: "The Bottom Line",
        content:
          "When preschoolers trip a lot or seem a bit wobbly, it's not always a big deal. Sometimes it's their bodies whispering—maybe needing better food or a little extra sensory help. Good nutrition and staying active go hand in hand: the food fuels the nerves, and playing trains the brain. If your kid keeps tripping or it's affecting their daily activities, chat with their doctor. Checking iron and B vitamin levels, along with considering occupational therapy for sensory integration, can help your child feel more grounded—both physically and emotionally.",
      },
    ],
  },
  {
    slug: "teen-mood-swings-cravings",
    title: "Mood Swings, Cravings, and Late-Night Eating in Teens: A Metabolic Stress Response",
    excerpt:
      "It's 10:30 at night, and your teen is digging through the fridge—again. These late-night cravings and unpredictable moods point to something deeper.",
    date: "Mar 1, 2026",
    readTime: "7 min read",
    image: "/marketing-assets/blog-teen-cravings.jpg",
    category: "Teen Health",
    sections: [
      {
        content:
          "It's 10:30 at night, and your teen is digging through the fridge—again. One minute, they're moody and distant. The next, they're scarfing down cereal straight from the box. Sound familiar?\n\nThese late-night cravings and unpredictable moods aren't just \"typical teen stuff.\" They can point to something deeper—metabolic stress. Think insulin spikes, lost sleep, and scrambled hunger hormones.",
      },
      {
        heading: "Insulin Spikes: The Real Reason for Those Cravings",
        content:
          "Teens grab quick snacks all day long. Chips, energy drinks, sweet coffee. Every time, their blood sugar shoots up, and insulin steps in to pull it back down. But when this rollercoaster keeps repeating, those big drops hit hard. The brain panics when blood sugar crashes. It wants fast energy, usually sugar or refined carbs.\n\nThat's why so many teens deal with:\n• Cravings in the afternoon or late at night\n• Moodiness or \"brain fog\" before meals\n• Feeling wiped out even after eating\n\nSteady blood sugar brings steadier moods. Protein, fiber, and healthy fats slow things down, so insulin doesn't have to work overtime.",
      },
      {
        heading: "Sleep Deprivation: The Sneaky Hormone Saboteur",
        content:
          "Teens are running low on sleep more than any other age group. Homework, screens, stress—it all adds up to less than seven hours most nights. When sleep drops off, hunger hormones do their own thing. Ghrelin (the \"I'm starving\" hormone) goes up. Leptin (the \"I'm full\" hormone) drops down. Suddenly, your teen feels way hungrier—especially for sugar, fat, and junk food.\n\nLess sleep means more cravings and less willpower. Plus, chronic sleep loss cranks up cortisol, the stress hormone. That keeps blood sugar high at night and makes burning fat tougher.",
      },
      {
        heading: "The Stress Loop: When Body and Brain Fall Out of Sync",
        content:
          "Here's how the whole mess builds up:\n\n• Late-night screens wreck sleep\n• Bad sleep scrambles hormones (ghrelin up, leptin down, cortisol up)\n• Hormone chaos fuels cravings and emotional eating\n• Insulin swings cause mood crashes and fatigue\n\nAnd the cycle just keeps spinning. No wonder teens say they feel \"wired and tired\"—buzzing with energy at bedtime, dragging in the morning. Their bodies and sleep cycles are totally out of step.",
      },
      {
        heading: "Resetting the Rhythm: Breaking the Cycle",
        content:
          "The answer isn't some harsh diet. It's about getting back to balance and steady routines:\n\n1. **Start with protein at breakfast.** Eggs, yogurt, nut butter toast—whatever works. Protein in the morning helps keep insulin steady and cravings down later.\n2. **Eat real food every 3–4 hours.** Skipping meals tanks blood sugar and sets up overeating later on.\n3. **Set a screen-off time before bed.** Blue light messes with melatonin and throws off sleep.\n4. **Drink water before grabbing a snack.** Sometimes thirst feels like hunger.\n5. **Support real sleep.** Keep bedrooms dark and cool. Sticking to regular sleep-wake times helps get hormones (and moods) back on track.",
      },
      {
        heading: "What Parents Should Watch For",
        content:
          "• Frequent energy crashes or \"hangry\" blowups\n• Late-night snacking or skipping breakfast\n• Irritability or brain fog for no clear reason\n• Craving sweets or carbs after stress or bad sleep\n\nThese aren't signs your teen is lazy or lacks willpower. They're signals their body's under metabolic stress. Balanced meals, real sleep, and steady routines help retrain the brain's hunger signals.",
      },
      {
        heading: "The Bottom Line",
        content:
          "Teens live in a world of fast food, packed schedules, and nonstop screens. But their bodies still need the basics—steady blood sugar, good sleep, and consistent fuel. When those rhythms get out of whack, everything else—mood, appetite, energy—falls apart. Getting back to balance isn't about eating less or strict rules. It's about syncing up their metabolism with real life. When that happens, everything starts to feel a little less overwhelming.",
      },
    ],
  },
  {
    slug: "teen-girls-hormones-stress",
    title: "When Periods, Skin, and Energy Go Off Track in Teen Girls: Stress Meets Hormones",
    excerpt:
      "When stress and hormones collide, the body's inner messaging system gets tangled up. Iron, omega-3s, and balanced meals can help bring things back on track.",
    date: "Mar 1, 2026",
    readTime: "7 min read",
    image: "/marketing-assets/blog-teen-girls-hormones.jpg",
    category: "Teen Health",
    sections: [
      {
        content:
          "A while ago, your teen daughter had pretty steady moods, clear skin, and enough energy to get through the day. Lately, though, things feel off. Her periods come and go, her skin's breaking out, and she's always tired. You've double-checked her meals and sleep and maybe even got her bloodwork done, but it still feels like something's missing.\n\nHere's what's going on: when stress and hormones collide, the body's inner messaging system gets tangled up. There's the HPA axis (the stress response team) and the HPO axis (the one in charge of periods and hormones). Toss in low iron or not enough omega-3s, and the balance gets even trickier.",
      },
      {
        heading: "The Stress–Hormone Conversation",
        content:
          "Inside her body, two big systems are always chatting. The HPA axis handles stress. The HPO axis manages periods. When life gets stressful—school, friends, sports—the HPA axis pumps out cortisol, the main stress hormone. Too much cortisol basically tells the brain, \"Now's not a great time for periods.\" So cycles get thrown off. She might miss her period, get moodier, break out, or just feel wiped out.\n\nBottom line: chronic stress steals from hormone balance, all so the body can focus on getting through tough times.",
      },
      {
        heading: "Why Skin Acts Up",
        content:
          "High cortisol leads to more oil and inflammation, which means more acne. Stress cravings—like sugar or caffeine—can mess with blood sugar and add more fuel to the fire. If she's not eating enough omega-3s (which help tamp down inflammation), breakouts and energy crashes get even worse. Omega-3s actually help calm both the stress response and inflammation, so they can make a real difference in skin and mood.",
      },
      {
        heading: "Iron: The Overlooked Energy Booster",
        content:
          "Teen girls lose iron every month with their periods, and growing fast means they need even more. Low iron isn't just about feeling tired—it makes it harder to concentrate, can leave her feeling irritable or anxious, and even messes with brain function.\n\nWhen iron's low, oxygen doesn't reach tissues as well, the brain gets foggy, workouts feel harder, and hormones don't work right. Foods like meat, poultry, fish, lentils, spinach, and iron-fortified cereals (especially when paired with vitamin C) can help build those stores back up.",
      },
      {
        heading: "When Stress Wrecks the Cycle",
        content:
          "Too much stress (even from over-exercising or not eating enough) can totally throw off the brain–ovary connection. This is called functional hypothalamic amenorrhea, and it's showing up more and more in high-performing, stressed-out teens.\n\nWatch out for:\n• Skipped periods\n• Feeling chilly or dizzy\n• Trouble focusing or sleeping\n• More anxiety\n\nWhat helps? Cut stress, eat well, and focus on getting enough iron, healthy fats, and protein.",
      },
      {
        heading: "Small Steps That Actually Work",
        content:
          "• Start breakfast with protein and healthy fats—eggs, nut butter toast, or Greek yogurt all help keep cortisol steady.\n• Add omega-3s—think salmon, chia seeds, or an algae supplement.\n• Rebuild iron—pair spinach, beans, or red meat with vitamin C from berries or lemon so her body can actually use that iron.\n• Make a habit out of stress relief—deep breathing, journaling, or taking a walk outside can really help lower cortisol and support hormone balance.\n• Don't skip meals or try extreme diets—the body sees food shortages as stress, which just makes things worse for hormones.",
      },
      {
        heading: "The Bottom Line",
        content:
          "When stress takes over, the brain's stress and hormone centers stop working together. You end up with irregular periods, breakouts, fatigue, and mood swings. But when you feed her body with steady meals, enough iron, and omega-3s—and help her manage stress—her brain and ovaries start syncing up again.\n\nBecause hormone health isn't just about periods. It's about energy, confidence, and feeling good, inside and out.",
      },
    ],
  },
];

// --- New blogs appended below ---
const newBlogs: BlogPost[] = [
  {
    slug: "tired-moody-kids-stress-nutrition",
    title: "Why Some Kids Are Always Tired, Moody, or Falling Sick: The Stress–Nutrition Connection Parents Miss",
    excerpt: "A lot of what looks like attitude or weak immunity actually comes down to nutrient fatigue — iron, B12, and protein deficits that stress makes worse.",
    date: "Mar 1, 2026",
    readTime: "6 min read",
    image: "/marketing-assets/blog-tired-kids-nutrition.jpg",
    category: "Nutrition",
    sections: [
      {
        content: "Your kid wakes up grumpy, drags through the day, and seems to catch every cold in sight. You start wondering—is this just a rough patch? Are they not getting enough sleep? Or maybe, underneath it all, their body's just running on empty.\n\nA lot of what looks like attitude or weak immunity actually comes down to something called nutrient fatigue. Basically, their brain and body aren't getting enough of the right fuel to handle stress, focus, and all the growing they're doing. And usually, the missing links are iron, vitamin B12, and protein—the unsung heroes behind your child's mood, energy, and ability to bounce back.",
      },
      {
        heading: "The Hidden Connection: Stress Sucks Up Nutrients",
        content: "Everyday stress—school, sensory overload, big feelings—makes your child's nervous system work overtime. When that stress switch stays on, their body chews through nutrients way faster than it can replace them.\n\nIron, B12, and protein play a big part in:\n• Making red blood cells (more oxygen, more energy)\n• Producing mood chemicals like serotonin and dopamine\n• Protecting nerves (so kids can focus and stay calm)\n\nWhen your child runs low on these, it's a recipe for tiredness, crankiness, brain fog, and catching every bug that goes around.",
      },
      {
        heading: "Iron: The Oxygen Delivery Guy",
        content: "Think of iron as the delivery truck bringing oxygen to every cell. Without enough, your kid's brain and muscles just can't keep up.\n\nLow iron means low energy. You might notice:\n• Pale skin, dark circles\n• Short attention span\n• Getting sick a lot\n• Weird cravings for non-food items (like ice)\n\n**Where to get it:**\n• Lean red meat, chicken, eggs\n• Lentils, spinach, pumpkin seeds\n(Eat with some vitamin C—think oranges or peppers—to help the body absorb more.)",
      },
      {
        heading: "Vitamin B12: The Brain's Jump Starter",
        content: "B12 turns food into energy and keeps the nerves firing right. If your child eats mostly vegetarian or doesn't get much dairy, they might not get enough.\n\n**Signs to watch for:**\n• Moody, anxious, or unusually quiet\n• Tingling hands or feet\n• Trouble concentrating\n• Still tired, even after sleeping\n\n**Good sources:**\n• Fish, eggs, milk, cheese, fortified cereals\n• If your family is mostly plant-based, look for B12-fortified foods or talk to your doctor about a supplement.",
      },
      {
        heading: "Protein: Calm, Growth, and Everything in Between",
        content: "Protein isn't just about muscles. It's the raw material for the brain chemicals that help kids deal with stress, emotions, and focus. Without enough protein, kids can feel foggy, hungry all the time, or just plain moody.\n\n**Great options:**\n• Eggs, yogurt, cheese\n• Fish, chicken\n• Lentils, chickpeas, tofu, quinoa\n\nTry kicking off the day with a protein-rich breakfast—it helps keep blood sugar steady and focus sharp.",
      },
      {
        heading: "How Nutrition and the Nervous System Feed Each Other",
        content: "When kids are stressed out (think school worries, separation anxiety, or just too much going on), their connection between brain and gut—the vagus nerve—takes a hit. That leads to a tense stomach, poor digestion, and less nutrient absorption, which just adds to the fatigue.\n\nIt's a loop: Stress → Tense gut → Poor absorption → Fewer nutrients → More fatigue and stress\n\n**Break the cycle by:**\n• Serving balanced meals every 3–4 hours\n• Slowing down meals—encourage deep breaths first\n• Adding omega-3s (walnuts, flaxseed) to help calm the brain and body",
      },
      {
        heading: "The Big Takeaway",
        content: "If your child's always tired, moody, or getting sick, don't just chalk it up to sleep or 'bad behaviour.' Their cells could be running on fumes. A well-fed nervous system means a calmer, more resilient kid. When you support your child's diet with enough iron, B12, and protein, you're not just helping their health. You're fueling their confidence, focus, and happiness.\n\nSo, before you get frustrated by another moody morning or tired meltdown, take a look at what's on their plate. Sometimes, the real fix starts at dinner.",
      },
    ],
  },
  {
    slug: "kids-constant-snacking-blood-sugar",
    title: "Why Some Kids Need Constant Snacking: Blood Sugar Instability vs Habit",
    excerpt: "Is your kid really hungry or is it just a habit? A lot of this comes down to how blood sugar rises and falls, and how protein keeps things steady.",
    date: "Mar 1, 2026",
    readTime: "5 min read",
    image: "/marketing-assets/blog-kids-snacking.jpg",
    category: "Nutrition",
    sections: [
      {
        content: "It's only mid-morning, and your kid's already asking for another snack. Not long after, you hear the same request. You glance at the clock. Lunch isn't even close, but somehow, the hunger just keeps coming.\n\nSo, are they really hungry, or is it just a habit? Honestly, a lot of this comes down to how blood sugar rises and falls, and how protein and insulin keep things steady (or not). If you've ever wondered why some kids seem to snack non-stop, there's usually a reason hiding in their food routine.",
      },
      {
        heading: "Let's Talk Blood Sugar",
        content: "Glucose is the main fuel for the brain. Whenever your child eats—especially carbs—blood sugar goes up. Insulin then steps in to move that sugar into the cells, giving them energy. But here's where things go sideways: if a meal's all carbs and not enough protein or fat, blood sugar shoots up fast, then crashes just as quickly. That sudden drop tells the brain, 'Hey, we're running on empty—eat something!' Even if they don't really need it, kids start reaching for snacks just to chase that energy.",
      },
      {
        heading: "It's a Rollercoaster",
        content: "Give a kid crackers, chips, juice, or cookies all day and you get this repeating pattern: quick sugar rush, insulin spike, a crash, and suddenly, they're tired, cranky, and 'starving' again.\n\nTheir brain gets used to this cycle and starts expecting constant snacks. It's not that snacks themselves are the problem—it's what's in them and when they show up.",
      },
      {
        heading: "Enter Protein",
        content: "It's like an anchor, keeping blood sugar from spiking and crashing. Protein also fires up those 'I'm full' signals in the brain (thanks, peptide YY and GLP-1). Without enough protein, kids burn through carbs in no time, leaving them hungry again before you know it.\n\nFor preschoolers, aim for 13–19 grams a day. School-age kids need around 19–34 grams.\n\n**Where do you find it?**\nEggs, yogurt, cheese, lentils, chickpeas, tofu, chicken, fish, turkey, nut butters, and seeds all work.",
      },
      {
        heading: "Want to Break the Non-Stop Snacking Loop?",
        content: "Try a few simple tweaks:\n\n1. Make sure every meal has some protein and fat. For example: eggs, toast, and fruit will keep them going longer than just cereal and milk.\n2. Go for 'smart snacks.' Pair carbs with protein or fat, like apple with nut butter, crackers and cheese, banana with yogurt, or a whole-grain muffin with milk.\n3. Don't let them graze all day. Spacing snacks about 2.5 to 3 hours apart gives real hunger cues a chance to come back.\n4. Offer water first. Sometimes, kids are actually thirsty, not hungry—especially in the afternoon.\n5. Keep mornings chill. Cortisol (that stress hormone) can spike blood sugar early, but a balanced, protein-rich breakfast helps smooth things out.",
      },
      {
        heading: "But Snacking Isn't Always About Food",
        content: "Sometimes, it's just about feelings. After school, especially, kids might snack because they're bored, stressed, or just need to unwind. To help, try a calming activity before snack time, and ask them, 'Is your tummy hungry, or is your mouth just bored?' Teaching them the difference between real hunger and emotional munching goes a long way.",
      },
      {
        heading: "Bottom Line",
        content: "Constant snacking usually means blood sugar's on a rollercoaster, or meals are missing some key protein. You don't need to ditch snacks—just balance them out. When meals and snacks include protein, fibre, and fat, your child's energy lasts longer, moods stay even, and that never-ending hunger finally fades into the background.",
      },
    ],
  },
  {
    slug: "teens-dizzy-weak-stress",
    title: "Why Teens Feel Dizzy, Weak, or Light-Headed Under Stress: Electrolytes, Iron, or Blood Sugar?",
    excerpt: "When stress hits and electrolytes, iron, or blood sugar drop, the brain and body stop working together smoothly. Here's what actually helps.",
    date: "Mar 1, 2026",
    readTime: "6 min read",
    image: "/marketing-assets/blog-teen-dizzy-stress.jpg",
    category: "Teen Health",
    sections: [
      {
        content: "Your teen jumps up from the couch and suddenly everything spins. Or maybe, after a rough day, they complain their hands are shaky, they feel weak, or they're seeing 'stars.' You can't help but wonder—are they just dehydrated? Is it low iron? Maybe it's anxiety?\n\nHonestly, it might be all of those things, tangled up in one bigger issue: orthostatic stress and imbalanced micronutrients. When stress hits and electrolytes, iron, or blood sugar drop, the brain and body stop working together smoothly.",
      },
      {
        heading: "What Really Happens When You Stand Up Fast",
        content: "When a teen stands quickly, blood rushes down to their legs for a second. Normally, the body reacts right away—blood vessels tighten, the heart speeds up, and blood keeps flowing to the brain. But for some teens, especially those under constant stress or missing key nutrients, this reflex just doesn't work as well.\n\nSo what do you see? Dizziness, 'graying out,' a racing heart, shaky limbs, trouble focusing. This is called orthostatic intolerance, and it gets worse with stress, dehydration, or growth spurts.",
      },
      {
        heading: "The Power of Electrolytes",
        content: "Electrolytes—think sodium, potassium, magnesium—keep nerves and muscles firing right. When teens sweat a lot, skip meals, or only drink plain water, these minerals drop.\n\n**What works:**\n• A pinch of sea salt in water after sports\n• Unsweetened electrolyte drinks\n• Potassium-rich foods like bananas or potatoes\n• Magnesium from nuts, seeds, dark chocolate, or greens\n\nHeads up: teens who chug energy drinks or too much caffeine lose electrolytes faster, and symptoms just get worse.",
      },
      {
        heading: "Iron—Not Just for Strength",
        content: "Iron helps red blood cells carry oxygen. Not enough iron means not enough oxygen for the brain, and that brings on dizziness and fatigue. Teen girls often run low because of periods. Boys can burn through iron during growth spurts. Stress doesn't help—it blocks iron absorption.\n\n**Signs your teen's iron is low:**\n• Pale skin\n• Cold hands\n• Tired even after sleep\n• Weird cravings for ice or non-food stuff\n• Breathlessness after just a little activity\n\nIron-rich foods like lean meat, eggs, lentils, spinach, and pumpkin seeds help. Add vitamin C (oranges, peppers) to boost absorption.",
      },
      {
        heading: "Blood Sugar—The Overlooked Factor",
        content: "If teens skip meals, eat mostly processed carbs, or go too long without food—especially when stressed—their blood sugar drops. The brain runs low on fuel, so you get sudden dizziness, weak limbs, sugar cravings, or a pounding heart.\n\nBalanced meals with protein, fiber, and healthy fats keep blood sugar steady and help prevent those dizzy spells. Think peanut butter toast, Greek yogurt with fruit, or eggs and whole-grain bread.",
      },
      {
        heading: "Stress—The Wild Card",
        content: "Stress hormones like cortisol and adrenaline mess with how the body manages salt, sugar, and fluids. Ongoing stress drains electrolytes and makes it harder to keep blood pressure up, which leads to more fatigue and dizziness—especially after emotional drama or panic.\n\nSimple habits help—a few deep breaths, taking your time to stand up, drinking mineral-rich water. These small things teach the body to handle stress better.",
      },
      {
        heading: "How to Help Your Teen Regain Their Balance",
        content: "• Hydrate smart: Use water with a pinch of salt or minerals, not just plain water, when under stress.\n• Eat on time: Don't let them go hours without food. Pair carbs with protein or fat.\n• Check iron: Especially for menstruating girls or vegetarian teens.\n• Get magnesium: Almonds, spinach, dark chocolate, or a supplement when needed.\n• Move gently: Regular walks or yoga keep blood vessels strong.\n• Sleep and sunlight: Both help keep hormones and blood pressure in check.",
      },
      {
        heading: "Bottom Line",
        content: "When teens feel dizzy, weak, or light-headed, it's not just in their head. Their bodies are sending a clear signal: 'I need a refill.' By restoring electrolytes, keeping blood sugar steady, fixing iron levels, and calming their nervous system, you help them feel strong—physically and emotionally. And they can stand up tall, without the world spinning.",
      },
    ],
  },
];

blogs.push(...newBlogs);
