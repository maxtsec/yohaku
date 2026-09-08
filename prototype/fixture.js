// Fixture analysis data for the Yohaku prototype.
//
// IMPORTANT: this is authored sample data, not a real transcript. It does not
// come from the YouTube video the prototype embeds, and no AI call produced it.
// It exists so the interaction design in DESIGN.md can be exercised end to end
// before the transcript provider and Gemini integration are built.
//
// Shape mirrors the logical model in TECHNICAL.md section 9: sentences carry
// stable IDs and millisecond timings, learning points hang off a sentence and
// carry a category, expression, short and detailed explanation.

const FIXTURE = {
  video: {
    youtubeId: 'Kr-aY2k2JXU',
    title: 'カフェ Vlog（サンプル）',
    channel: 'Yohaku prototype fixture',
  },

  // Categories fixed by DESIGN.md section 8.
  categories: ['vocabulary', 'grammar', 'expression', 'tone', 'context'],

  categoryLabels: {
    vocabulary: { 'zh-Hant': '單字', en: 'Vocabulary' },
    grammar: { 'zh-Hant': '文法', en: 'Grammar' },
    expression: { 'zh-Hant': '表達方式', en: 'Expression' },
    tone: { 'zh-Hant': '語氣', en: 'Tone' },
    context: { 'zh-Hant': '語境', en: 'Context' },
  },

  sentences: [
    {
      id: 's01', startMs: 0, endMs: 2800,
      jp: 'みなさん、こんにちは。',
      tr: { 'zh-Hant': '大家好。', en: 'Hi everyone.' },
      points: [],
    },
    {
      id: 's02', startMs: 2800, endMs: 9200,
      jp: '今日はですね、ちょっと前から気になってたカフェに行ってみようと思います。',
      tr: {
        'zh-Hant': '今天呢，我打算去一家從之前就一直很在意的咖啡店看看。',
        en: 'Today I am going to go check out a café I have had my eye on for a while.',
      },
      points: [
        {
          id: 's02-p1', category: 'tone', expression: 'ですね',
          short: {
            'zh-Hant': '插在句中的緩衝語，讓語氣變得輕鬆親切。',
            en: 'A mid-sentence softener that makes the delivery casual and friendly.',
          },
          detailed: {
            'zh-Hant': '「今日はですね」的「ですね」不帶實際意思，只是說話者一邊組織內容一邊拖住節奏的緩衝語。它保留了敬體的禮貌，但比「今日は」直接接下去更放鬆，是 vlog 及對談中很常見的講法。書面語不會這樣用。',
            en: 'The ですね in 今日はですね carries no meaning of its own. It is a filler that buys the speaker a beat while they organise what comes next. It keeps the polite です register but sounds far more relaxed than starting straight into 今日は…, which is why it turns up constantly in vlogs and interviews. You would not write it.',
          },
        },
        {
          id: 's02-p2', category: 'grammar', expression: '〜てみようと思います',
          short: {
            'zh-Hant': '「試著做看看」＋意志形＋と思います，表達還算柔軟的打算。',
            en: '"Try doing" plus volitional plus と思います: a softly stated intention.',
          },
          detailed: {
            'zh-Hant': '這是三層結構疊起來的。「行ってみる」是「去看看、試試看」；改成意志形「行ってみよう」變成「我要去看看」；再加「と思います」就把決心降級成「我是這樣想的」。比起直接說「行きます」，這個說法聽起來沒那麼武斷，也留了改變主意的餘地，是講自己計劃時最自然的講法之一。',
            en: 'Three layers stacked. 行ってみる is "go and see how it is"; the volitional 行ってみよう turns that into "I will go and see"; adding と思います downgrades the resolve to "that is what I am thinking". Compared with a flat 行きます it sounds less declarative and leaves room to change your mind, which is why it is one of the most natural ways to state your own plans.',
          },
        },
        {
          id: 's02-p3', category: 'vocabulary', expression: '気になってた',
          short: {
            'zh-Hant': '「気になる」是「一直放在心上、很好奇」，不是「擔心」。',
            en: '気になる here means "has been on my mind / curious about", not "worried".',
          },
          detailed: {
            'zh-Hant': '字典常把「気になる」譯成「在意、擔心」，但這裡完全沒有負面意思，是「一直很好奇、很想去」。「気になってた」是「気になっていた」口語省略了「い」，表示這個狀態從之前持續到現在。日常會話幾乎都會這樣縮。',
            en: 'Dictionaries often give 気になる as "to worry about", but there is nothing negative here — it is "I have been curious about it". 気になってた is the spoken contraction of 気になっていた, dropping the い, and the ている form marks a state that has continued up to now. This contraction is near-universal in casual speech.',
          },
        },
      ],
    },
    {
      id: 's03', startMs: 9200, endMs: 13500,
      jp: '駅から歩いて五分くらいなんですけど、',
      tr: {
        'zh-Hant': '從車站走路大概五分鐘，不過⋯⋯',
        en: 'It is about a five-minute walk from the station, but…',
      },
      points: [
        {
          id: 's03-p1', category: 'grammar', expression: 'んですけど',
          short: {
            'zh-Hant': '這裡的「けど」不是「但是」，是柔和的開場鋪陳。',
            en: 'This けど is not "but" — it is a soft lead-in to whatever comes next.',
          },
          detailed: {
            'zh-Hant': '「んです」是說明語氣的「のです」口語形，用來替接下來的話提供背景。後面的「けど」表面上是逆接，實際上只是把句子留開，讓聽者等下一句。翻成「不過」有時反而太重，很多情況只是「這樣的話⋯⋯」的語感。日文很常用這種未說完的結尾來保持柔和。',
            en: 'んです is the spoken form of のです, framing the clause as background or explanation. The けど that follows looks like a contrastive "but", but its real job is to leave the sentence open so the listener waits for the next line. Translating it as "but" is often too strong; frequently it is closer to "so, …". Leaving a sentence unfinished this way is a standard Japanese softening device.',
          },
        },
      ],
    },
    {
      id: 's04', startMs: 13500, endMs: 19000,
      jp: '実はこの辺、来るの初めてなんですよ。',
      tr: {
        'zh-Hant': '其實這一帶，我是第一次來。',
        en: 'Actually, this is my first time in this area.',
      },
      points: [
        {
          id: 's04-p1', category: 'expression', expression: '実は',
          short: {
            'zh-Hant': '用來鋪陳一個小小的自我揭露。',
            en: 'Sets up a small personal reveal.',
          },
          detailed: {
            'zh-Hant': '「実は」字面是「事實上」，但實際功能是提示「接下來要講一件你可能不知道的事」。它讓後面的內容變成一個小小的分享，而不是單純報告。用在自己的事情上時，語氣是親近而不是嚴肅的。',
            en: 'Literally "in fact", but its real function is to flag that something the listener probably does not know is coming. It reframes the following clause as a small confidence rather than a plain statement. Used about yourself, the register is intimate rather than serious.',
          },
        },
        {
          id: 's04-p2', category: 'grammar', expression: '来るの初めて',
          short: {
            'zh-Hant': '用「の」把動詞名詞化，才能接「初めて」。',
            en: 'の nominalises the verb so it can be described by 初めて.',
          },
          detailed: {
            'zh-Hant': '「初めて」在這裡是名詞（第一次），前面需要一個名詞性的東西，所以用「の」把動詞「来る」名詞化。完整說法是「来るのが初めてなんです」，口語常常把「が」省掉。這個「の」名詞化是日文最常用的結構之一。',
            en: '初めて here is a noun ("the first time"), so what precedes it has to be nominal. の turns the verb 来る into a noun phrase, "the coming". The full form would be 来るのが初めてなんです; casual speech drops the が. This nominalising の is one of the highest-frequency structures in Japanese.',
          },
        },
        {
          id: 's04-p3', category: 'tone', expression: 'んですよ',
          short: {
            'zh-Hant': '「よ」把資訊當成分享給對方的新消息。',
            en: 'よ presents the information as news being shared with you.',
          },
          detailed: {
            'zh-Hant': '「よ」表示說話者認為這是聽者還不知道的資訊，帶有「告訴你喔」的味道。配上說明語氣的「んです」，整句變成「其實呢，情況是這樣的喔」。對觀眾說話時用「よ」會拉近距離；但用得太多或對上司使用會顯得太主動、甚至有點強加。',
            en: 'よ marks the information as something the speaker believes the listener does not yet know — a "just so you know" flavour. Combined with explanatory んです, the sentence becomes "the thing is, it is actually like this, you see". Addressed to viewers it closes distance, but overused, or used toward a superior, it can sound pushy.',
          },
        },
      ],
    },
    {
      id: 's05', startMs: 19000, endMs: 22000,
      jp: 'あ、ここかな。',
      tr: { 'zh-Hant': '啊，是這裡吧。', en: 'Ah, is this it?' },
      points: [
        {
          id: 's05-p1', category: 'tone', expression: 'かな',
          short: {
            'zh-Hant': '自言自語式的不確定，不是在問對方。',
            en: 'Talking to oneself — not actually asking the listener.',
          },
          detailed: {
            'zh-Hant': '「かな」表示說話者自己在推測，不期待回答。跟「ここですか」（真的在問人）差別很大。在 vlog 裡它讓觀眾像是聽到說話者的內心話，是製造親近感的常見手法。「かしら」語感偏女性，「かな」則男女通用。',
            en: 'かな marks the speaker working something out for themselves, with no answer expected. That is quite different from ここですか, which genuinely asks someone. In a vlog it lets the viewer overhear the speaker thinking aloud, a common way of creating intimacy. かしら is a more feminine-coded equivalent; かな is used by everyone.',
          },
        },
      ],
    },
    {
      id: 's06', startMs: 22000, endMs: 27500,
      jp: 'わ、思ったより小さいお店ですね。',
      tr: {
        'zh-Hant': '哇，比想像中小的店呢。',
        en: 'Oh, the place is smaller than I expected.',
      },
      points: [
        {
          id: 's06-p1', category: 'grammar', expression: '思ったより',
          short: {
            'zh-Hant': '「比原本想的還要⋯⋯」的固定比較句型。',
            en: 'Fixed comparative: "more … than I thought".',
          },
          detailed: {
            'zh-Hant': '「Ａより」是「比Ａ」，把Ａ換成過去式的「思った」就變成「比我原本想的」。整組「思ったより＋形容詞」是一個固定講法，用來表示實際情況跟預期有落差。注意動詞要用過去式「思った」，不是「思う」。',
            en: 'Ａより means "compared with Ａ"; putting the past-tense 思った in that slot gives "compared with what I thought". 思ったより plus an adjective is a set pattern for flagging a gap between expectation and reality. Note the verb must be past 思った, not 思う.',
          },
        },
        {
          id: 's06-p2', category: 'tone', expression: 'ですね',
          short: {
            'zh-Hant': '句尾的「ね」是邀請觀眾一起認同。',
            en: 'Sentence-final ね invites the viewer to share the impression.',
          },
          detailed: {
            'zh-Hant': '這裡的「ね」跟 s02 句中的緩衝用法不同，是放在句尾邀請對方同意：「很小對吧？」。即使觀眾無法回答，用「ね」也能營造一起看、一起反應的感覺。換成「小さいお店です」會變成單純陳述，距離感立刻拉遠。',
            en: 'This ね differs from the mid-sentence filler in s02: at the end of a sentence it invites agreement — "small, isn\'t it?". Even though viewers cannot reply, ね creates the sense of watching and reacting together. Plain 小さいお店です would be a bare statement and would immediately feel more distant.',
          },
        },
      ],
    },
    {
      id: 's07', startMs: 27500, endMs: 33000,
      jp: 'でも、なんかいい感じ。',
      tr: { 'zh-Hant': '不過，感覺還不錯。', en: 'But it has a nice feel to it.' },
      points: [
        {
          id: 's07-p1', category: 'expression', expression: 'なんか',
          short: {
            'zh-Hant': '模糊化的緩衝詞，避免把話講得太滿。',
            en: 'A vagueness marker that stops the claim sounding too definite.',
          },
          detailed: {
            'zh-Hant': '「なんか」原本是「なにか（某種）」的口語形，在會話中大量用作緩衝，意思接近「總覺得、有點」。它把後面的判斷變得柔軟、主觀，不是斷定。日常會話出現頻率極高，但正式場合或書面語應避免。',
            en: 'Originally a colloquial なにか ("something"), なんか is used heavily in speech as a hedge, close to "kind of" or "somehow". It makes the judgement that follows feel soft and subjective rather than asserted. Extremely frequent in casual conversation, but to be avoided in formal or written contexts.',
          },
        },
        {
          id: 's07-p2', category: 'expression', expression: 'いい感じ',
          short: {
            'zh-Hant': '固定講法，「感覺／氣氛不錯」，不是逐字的「好的感覺」。',
            en: 'Set phrase: "nice vibe", not a literal "good feeling".',
          },
          detailed: {
            'zh-Hant': '「いい感じ」是一個整體的固定表達，用來稱讚氣氛、外觀、狀態或進度，範圍非常廣，從店的裝潢到工作進度都能用。它刻意不說明好在哪裡，這種模糊本身就是它好用的原因。注意不要拆成「いい」＋「感じ」逐字理解。',
            en: 'いい感じ works as a single set expression praising atmosphere, appearance, state or progress — everything from a shop interior to how a task is going. It deliberately does not specify what is good, and that vagueness is exactly why it is so useful. Do not parse it word by word as "good" plus "feeling".',
          },
        },
      ],
    },
    {
      id: 's08', startMs: 33000, endMs: 38000,
      jp: 'じゃあ、入ってみましょう。',
      tr: { 'zh-Hant': '那麼，進去看看吧。', en: 'All right, let us head in.' },
      points: [],
    },
    {
      id: 's09', startMs: 38000, endMs: 45000,
      jp: 'すみません、一人なんですけど。',
      tr: {
        'zh-Hant': '不好意思，我一個人⋯⋯',
        en: 'Excuse me, it is just one…',
      },
      points: [
        {
          id: 's09-p1', category: 'context', expression: '一人なんですけど。',
          short: {
            'zh-Hant': '故意講一半，把請求留給對方接話。',
            en: 'Deliberately left unfinished so the other person completes the request.',
          },
          detailed: {
            'zh-Hant': '這句沒有說出「請幫我安排座位」，只講到條件就停住。日文很常用這種未完成句來提出請求：把結論留給對方說，避免直接命令，聽起來更客氣。店員通常會自然接「お一人様ですね、こちらへどうぞ」。如果完整說出請求，反而顯得生硬。',
            en: 'The request itself — "please seat me" — is never said; the sentence stops after the condition. Japanese very often makes requests with this kind of unfinished sentence, leaving the conclusion for the other person to supply so nothing sounds like an order. Staff will typically complete it with お一人様ですね、こちらへどうぞ. Spelling the request out in full would actually sound blunt.',
          },
        },
        {
          id: 's09-p2', category: 'vocabulary', expression: '一人',
          short: {
            'zh-Hant': '這裡是「一位」的意思，不是「孤單」。',
            en: 'Here it means "party of one", not "lonely".',
          },
          detailed: {
            'zh-Hant': '在餐飲場合「一人」單純是人數，等於中文的「一位」。店員會用敬語說「お一人様」。它不帶「一個人很寂寞」的意思，那個語感要用「一人ぼっち」或「寂しい」才會出現。',
            en: 'In a restaurant context 一人 is simply a headcount, equivalent to "table for one". Staff will use the honorific お一人様. It carries none of the "alone and lonely" nuance — that would need 一人ぼっち or 寂しい.',
          },
        },
      ],
    },
    {
      id: 's10', startMs: 45000, endMs: 50000,
      jp: '窓際の席、空いてますか。',
      tr: {
        'zh-Hant': '靠窗的位子有空嗎？',
        en: 'Is the window seat free?',
      },
      points: [
        {
          id: 's10-p1', category: 'vocabulary', expression: '空いてます',
          short: {
            'zh-Hant': '「空く」的ている形，表示「現在是空著的狀態」。',
            en: 'The ている form of 空く: the state of currently being free.',
          },
          detailed: {
            'zh-Hant': '「空く」是「變空」的瞬間動詞，所以要表示「現在空著」必須用「空いている」，口語再省略成「空いてます」。如果說「空きますか」會變成問「等一下會空出來嗎」，意思不同。這是瞬間動詞用ている表示結果狀態的典型例子。',
            en: '空く is a punctual verb meaning "to become free", so describing the present state requires 空いている, contracted in speech to 空いてます. Asking 空きますか would instead mean "will it become free later?" — a different question. This is a textbook case of a punctual verb taking ている to express a resulting state.',
          },
        },
      ],
    },
    {
      id: 's11', startMs: 50000, endMs: 56000,
      jp: 'よかった、ちょうど一つ空いてた。',
      tr: {
        'zh-Hant': '太好了，剛好空著一個。',
        en: 'Oh good — there was exactly one open.',
      },
      points: [
        {
          id: 's11-p1', category: 'expression', expression: 'よかった',
          short: {
            'zh-Hant': '過去式表示「鬆一口氣」，不是「（過去）很好」。',
            en: 'Past tense expressing relief, not "it was good".',
          },
          detailed: {
            'zh-Hant': '「よかった」形式上是「いい」的過去式，但這裡不是描述過去，而是表達當下的安心：「還好、太好了」。日文用過去式表達剛確認的事實所帶來的情緒，這個用法很常見。對別人的好消息說「よかったですね」則是「那真是太好了」。',
            en: 'Formally the past tense of いい, but it is not describing the past — it expresses relief in the present: "phew, great". Japanese regularly uses the past form for the emotion attached to a fact just confirmed. Said to someone else about their good news, よかったですね means "I am glad to hear it".',
          },
        },
        {
          id: 's11-p2', category: 'vocabulary', expression: 'ちょうど',
          short: {
            'zh-Hant': '「剛好、正好」，強調不多不少的巧合。',
            en: '"Exactly / just" — stresses the coincidence of the fit.',
          },
          detailed: {
            'zh-Hant': '「ちょうど」表示數量、時間或狀況剛好符合，這裡是「不多不少剛好一個」。也能用在時間（ちょうど三時）或金額（ちょうど千円）。它強調的是巧合的精準，跟單純的「一つ空いてた」語感差別在於那份「運氣真好」的意味。',
            en: 'ちょうど marks a quantity, time or situation as fitting exactly — here, "exactly one, no more no less". It also works with times (ちょうど三時) and amounts (ちょうど千円). The nuance it adds over a plain 一つ空いてた is the sense of lucky precision.',
          },
        },
      ],
    },
    {
      id: 's12', startMs: 56000, endMs: 63000,
      jp: 'メニュー、写真撮ってもいいですか。',
      tr: {
        'zh-Hant': '菜單可以拍照嗎？',
        en: 'Is it OK if I take a photo of the menu?',
      },
      points: [
        {
          id: 's12-p1', category: 'grammar', expression: '〜てもいいですか',
          short: {
            'zh-Hant': '請求許可的標準句型：「可以⋯⋯嗎？」',
            en: 'The standard permission pattern: "may I …?"',
          },
          detailed: {
            'zh-Hant': '「動詞て形＋もいいですか」是最通用的請求許可講法，禮貌程度中性，對店員、同事都適用。想更客氣可以用「〜てもよろしいでしょうか」。注意這是問「可不可以」，不是問對方意願；問意願要用別的說法。',
            en: 'Verb て-form plus もいいですか is the general-purpose way to ask permission, neutral in politeness and fine with shop staff or colleagues. A more deferential version is 〜てもよろしいでしょうか. Note that it asks whether something is permitted, not whether the other person wants to — that would need a different construction.',
          },
        },
      ],
    },
    {
      id: 's13', startMs: 63000, endMs: 70000,
      jp: 'あ、大丈夫ですって。',
      tr: {
        'zh-Hant': '啊，他說沒問題。',
        en: 'Ah, they said it is fine.',
      },
      points: [
        {
          id: 's13-p1', category: 'grammar', expression: 'って',
          short: {
            'zh-Hant': '口語的引用助詞，等於「と言っています」。',
            en: 'Colloquial quotative particle, standing in for と言っています.',
          },
          detailed: {
            'zh-Hant': '句尾的「って」把前面的內容標記為別人說的話，是「と言っています／だそうです」的口語省略形。所以「大丈夫ですって」＝「（店員說）沒問題」。這個用法只在會話中出現，寫作時要還原成完整的引用形式。',
            en: 'Sentence-final って marks what precedes it as someone else\'s words — a spoken contraction of と言っています or だそうです. So 大丈夫ですって is "(they say) it is fine". It belongs to conversation only; in writing you would restore the full quotative form.',
          },
        },
        {
          id: 's13-p2', category: 'vocabulary', expression: '大丈夫',
          short: {
            'zh-Hant': '這裡是「可以、沒問題」的許可，不是「沒受傷」。',
            en: 'Here it grants permission — "that is fine" — not "unharmed".',
          },
          detailed: {
            'zh-Hant': '「大丈夫」的用法極廣：關心對方（大丈夫ですか＝你還好嗎）、表示許可（這裡）、甚至委婉拒絕（レジ袋は大丈夫です＝不用袋子）。意思完全靠語境決定，是初學者最容易誤解的詞之一。這句是回應拍照請求，所以是許可。',
            en: '大丈夫 stretches a long way: checking on someone (大丈夫ですか = are you OK?), granting permission (as here), and even declining politely (レジ袋は大丈夫です = I do not need a bag). Context alone decides, which makes it one of the most commonly misread words for learners. Here it answers a request to take a photo, so it is permission.',
          },
        },
      ],
    },
    {
      id: 's14', startMs: 70000, endMs: 77000,
      jp: 'じゃあ、このスペシャルラテにしようかな。',
      tr: {
        'zh-Hant': '那，就選這個特調拿鐵好了。',
        en: 'Then maybe I will go with this special latte.',
      },
      points: [
        {
          id: 's14-p1', category: 'grammar', expression: '〜にする',
          short: {
            'zh-Hant': '「決定選⋯⋯」，點餐時的固定用法。',
            en: '"I will go with …" — the standard verb for choosing.',
          },
          detailed: {
            'zh-Hant': '「Ａにする」表示從選項中決定選Ａ，點餐時幾乎都用這個，而不是「買う」或「食べる」。跟「Ａになる」（自然變成Ａ）相對：「する」是自己的決定，「なる」是自然的變化。',
            en: 'Ａにする means deciding on Ａ from among options, and it is what you almost always use when ordering, rather than 買う or 食べる. It contrasts with Ａになる ("to become Ａ"): する is a choice you make, なる is something that happens.',
          },
        },
        {
          id: 's14-p2', category: 'tone', expression: 'しようかな',
          short: {
            'zh-Hant': '意志形＋かな＝還在猶豫，尚未定案。',
            en: 'Volitional plus かな: still deciding, not settled.',
          },
          detailed: {
            'zh-Hant': '「しよう」是意志形（我要做），加上「かな」後就變成對自己的提問：「要不要這樣做呢」。所以整句是邊看菜單邊想、還沒完全決定的語感。真的要點餐時會改成「これにします」或「これをお願いします」，語氣明確得多。',
            en: 'しよう is the volitional ("I will do"), and adding かな turns it into a question to oneself: "shall I?". The line therefore sounds like someone still weighing the menu rather than deciding. To actually place the order you would switch to これにします or これをお願いします, which are far more definite.',
          },
        },
      ],
    },
    {
      id: 's15', startMs: 77000, endMs: 84000,
      jp: '甘いもの、久しぶりだなあ。',
      tr: {
        'zh-Hant': '好久沒吃甜的了啊。',
        en: 'It has been a while since I had something sweet.',
      },
      points: [
        {
          id: 's15-p1', category: 'expression', expression: '久しぶり',
          short: {
            'zh-Hant': '「隔了很久」，可單獨當名詞或問候語使用。',
            en: '"After a long time" — works as a noun and as a greeting.',
          },
          detailed: {
            'zh-Hant': '「久しぶり」表示距離上一次已經隔了很久，可以接名詞（久しぶりのカフェ），也可以單獨作句子（久しぶり！＝好久不見）。這裡「甘いもの、久しぶりだなあ」是把主題提到前面再評論，等於「甜的東西，真是好久沒碰了」。',
            en: '久しぶり marks a long gap since the last occurrence. It can modify a noun (久しぶりのカフェ) or stand alone as a greeting (久しぶり！ = long time no see). Here 甘いもの、久しぶりだなあ fronts the topic and then comments on it: "sweet things — it really has been a while".',
          },
        },
        {
          id: 's15-p2', category: 'tone', expression: 'だなあ',
          short: {
            'zh-Hant': '拉長的「なあ」是說給自己聽的感嘆。',
            en: 'The drawn-out なあ is a reflection addressed to oneself.',
          },
          detailed: {
            'zh-Hant': '「なあ」是「な」的拉長形，表示感慨、自言自語，不期待回應。跟對別人說的「ですね」不同，「だなあ」是常體，聽起來像內心話流露出來。在 vlog 裡這種說法讓觀眾覺得看到了說話者真實的一面。',
            en: 'なあ is a lengthened な expressing feeling to oneself, with no reply expected. Unlike ですね, which is addressed to someone, だなあ is plain form and sounds like an inner thought slipping out. In a vlog it gives viewers the sense of seeing the speaker unguarded.',
          },
        },
      ],
    },
    {
      id: 's16', startMs: 84000, endMs: 90000,
      jp: 'では、いただきます。',
      tr: { 'zh-Hant': '那麼，我開動了。', en: 'Right then — itadakimasu.' },
      points: [
        {
          id: 's16-p1', category: 'context', expression: 'いただきます',
          short: {
            'zh-Hant': '吃飯前的固定說法，一個人時也會說。',
            en: 'Said before eating, including when alone.',
          },
          detailed: {
            'zh-Hant': '「いただきます」是「もらう」的謙讓語，字面是「我領受了」。它表達對食物、做菜的人以及食材本身的感謝，不是宗教禱告。即使一個人吃飯、或在鏡頭前也會說，是幾乎自動的習慣。吃完後對應的是「ごちそうさまでした」。',
            en: 'いただきます is the humble form of もらう, literally "I receive". It expresses thanks for the food, for whoever prepared it, and for the ingredients themselves — it is not a religious grace. People say it eating alone or on camera; it is close to automatic. The counterpart after the meal is ごちそうさまでした.',
          },
        },
      ],
    },
  ],

  // Summary items that merge several learning points into one entry, as
  // described in TECHNICAL.md section 7. Every other point passes through
  // one-to-one. The app verifies that every point ID is covered exactly once.
  summaryMerges: [
    {
      ids: ['s02-p1', 's06-p2'],
      category: 'tone',
      expression: 'ですね（句中の緩衝／文末の同意）',
      short: {
        'zh-Hant': '同一個「ですね」，句中是緩衝、句尾是邀請同意，兩種功能要分開記。',
        en: 'The same ですね softens mid-sentence but invites agreement at the end — two distinct jobs.',
      },
    },
    {
      ids: ['s05-p1', 's14-p2'],
      category: 'tone',
      expression: 'かな（自問の終助詞）',
      short: {
        'zh-Hant': '「かな」都是說給自己聽的推測，接名詞或接意志形時語感略有不同。',
        en: 'Both かな uses are speculation aimed at oneself; the nuance shifts slightly after a noun versus a volitional.',
      },
    },
  ],
};
