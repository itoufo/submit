"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Sparkles,
  FolderKanban,
  Users,
  ArrowRight,
  CheckCircle2,
  Circle,
  BookOpen,
  Lightbulb,
  Target,
  Heart
} from "lucide-react";

const steps = [
  {
    number: 1,
    title: "観測ログを記録する",
    icon: FileText,
    description: "日々の思考、アイデア、気づきを短いメモとして記録します",
    details: [
      "「観測ログ」ページで新しいメモを作成",
      "140文字程度の短い思考でOK",
      "タグで分類すると後で探しやすい",
      "完璧を求めず、思いついたことをそのまま記録",
    ],
    tips: "1日1〜3個のペースで継続するのがおすすめ。量より継続が大事です。",
    link: "/memos",
    linkText: "観測ログを書く",
  },
  {
    number: 2,
    title: "AIにコンテンツ案を作ってもらう",
    icon: Sparkles,
    description: "記録したメモを選んで、AIがSNS投稿やブログ記事の下書きを生成します",
    details: [
      "「AIエディター」ページを開く",
      "コンテンツ化したいメモを選択（複数可）",
      "フォーマット（ツイート/ブログ/note）を選ぶ",
      "「生成」ボタンでAIが下書きを作成",
    ],
    tips: "関連するメモを2〜3個組み合わせると、より深みのあるコンテンツが生成されます。",
    link: "/ai-editor",
    linkText: "AIエディターを開く",
  },
  {
    number: 3,
    title: "プロジェクト提案を受ける",
    icon: Target,
    description: "3つ以上のメモが溜まると、AIがあなたの関心を分析してプロジェクトを提案します",
    details: [
      "メモが3つ以上になると提案機能が有効に",
      "AIがメモの傾向を分析",
      "連載やシリーズ化できそうなテーマを提案",
      "提案を承認するとプロジェクトが作成される",
    ],
    tips: "提案が的外れでも気にせず却下してOK。メモが増えるほど精度が上がります。",
    link: "/ai-editor",
    linkText: "提案を確認する",
  },
  {
    number: 4,
    title: "プロジェクトを育てる",
    icon: FolderKanban,
    description: "承認したプロジェクトに記事を追加して、コンテンツシリーズを構築します",
    details: [
      "「プロジェクト」ページでプロジェクト一覧を確認",
      "各プロジェクトにAI生成した記事を追加",
      "記事数がKPIとして表示される",
      "10記事を目標にコツコツ積み上げ",
    ],
    tips: "週1〜2記事のペースで続けると、3ヶ月で立派なコンテンツ資産になります。",
    link: "/projects",
    linkText: "プロジェクトを見る",
  },
  {
    number: 5,
    title: "サポーターと一緒に頑張る（任意）",
    icon: Heart,
    description: "友人や家族をサポーターとして招待し、応援メッセージをもらえます",
    details: [
      "「パートナー」ページで招待リンクを発行",
      "サポーターがリンクから登録",
      "サポーターはあなたの進捗を見れる",
      "応援メッセージ（エール）を送れる",
    ],
    tips: "一人で続けるのが難しい人は、パートナー機能を活用してみてください。",
    link: "/partner",
    linkText: "サポーターを招待",
  },
];

const faqs = [
  {
    question: "メモは何を書けばいいですか？",
    answer: "日常で感じたこと、仕事で気づいたこと、読んだ本の感想、ふと思いついたアイデアなど、何でもOKです。「後で使えるかも」と思ったことを気軽に記録してください。",
  },
  {
    question: "AIの生成結果がイマイチな時は？",
    answer: "別のメモの組み合わせを試すか、メモ自体をもう少し具体的に書き直してみてください。また、生成結果は下書きなので、自分で編集して仕上げることを前提にしています。",
  },
  {
    question: "プロジェクトって何ですか？",
    answer: "継続的にコンテンツを発信するテーマのことです。例えば「週刊AI技術メモ」「育児の気づきブログ」など。メモを分析して、あなたに合ったテーマをAIが提案します。",
  },
  {
    question: "サポーターには何が見えますか？",
    answer: "あなたのメモ数、プロジェクト数、記事数などの統計情報が見えます。メモの内容自体は見えないので、プライバシーは守られます。",
  },
];

export default function ManualPage() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">使い方ガイド</h1>
        </div>
        <p className="text-muted-foreground">
          submitで思考を資産に変える5つのステップ
        </p>
      </div>

      {/* コンセプト説明 */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            submitとは？
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            <strong>submit</strong>は、日々の思考を「観測ログ」として記録し、
            AIの力を借りてコンテンツ化するサービスです。
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-primary">1</div>
              <div className="text-sm">思考を記録</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-primary">2</div>
              <div className="text-sm">AIが整形</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-primary">3</div>
              <div className="text-sm">資産になる</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ステップナビゲーション */}
      <div className="flex justify-center gap-2 flex-wrap">
        {steps.map((step) => (
          <button
            key={step.number}
            onClick={() => setActiveStep(step.number)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
              activeStep === step.number
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {activeStep > step.number ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            Step {step.number}
          </button>
        ))}
      </div>

      {/* アクティブステップの詳細 */}
      {steps.map((step) => (
        <Card
          key={step.number}
          className={`transition-all duration-300 ${
            activeStep === step.number
              ? "ring-2 ring-primary"
              : "opacity-60"
          }`}
          style={{ display: activeStep === step.number ? "block" : "none" }}
        >
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {step.number}
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <step.icon className="h-5 w-5" />
                  {step.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  {step.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 手順リスト */}
            <div>
              <h4 className="font-medium mb-3">やること</h4>
              <ul className="space-y-2">
                {step.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">ヒント</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.tips}
                  </p>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-4">
              <a
                href={step.link}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6"
              >
                {step.linkText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              {step.number < steps.length && (
                <button
                  onClick={() => setActiveStep(step.number + 1)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent h-10 px-6"
                >
                  次のステップへ
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 全体フロー図 */}
      <Card>
        <CardHeader>
          <CardTitle>全体の流れ</CardTitle>
          <CardDescription>5つのステップの関係性</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center gap-2">
                <div
                  className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setActiveStep(step.number)}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    activeStep === step.number
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs mt-1 text-center max-w-[80px]">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>よくある質問</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
              <h4 className="font-medium mb-2">Q. {faq.question}</h4>
              <p className="text-sm text-muted-foreground">A. {faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 始めるボタン */}
      <div className="text-center py-8">
        <h3 className="text-xl font-bold mb-4">さあ、始めましょう！</h3>
        <p className="text-muted-foreground mb-6">
          まずは1つ目の観測ログを記録してみてください
        </p>
        <a
          href="/memos"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-lg font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-12 px-8"
        >
          観測ログを書く
          <ArrowRight className="ml-2 h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
