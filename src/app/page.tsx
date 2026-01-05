import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  FileText,
  FolderKanban,
  ArrowRight,
  Check,
  Lightbulb,
  Brain,
  Zap,
  Users,
  ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Project Insight
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">ログイン</Button>
            </Link>
            <Link href="/register">
              <Button>無料で始める</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            思考を資産に変える新しい方法
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            あなたの思考は、
            <span className="text-primary">資産</span>になる。
            <br />
            書かずに、選ぶだけ。
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            「情報発信が続かない」？ それはあなたのせいじゃない。
            <br />
            <strong>設計ミス</strong>だ。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                無料で試す
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#concept">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                コンセプトを知る
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* 問題提起セクション */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            なぜ、あなたの発信は続かないのか？
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-900">
              <CardContent className="pt-6">
                <Brain className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">思考量が多すぎる</h3>
                <p className="text-muted-foreground">
                  頭の中に情報がありすぎて、何から書けばいいか分からない
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-900">
              <CardContent className="pt-6">
                <Lightbulb className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">視座が高すぎる</h3>
                <p className="text-muted-foreground">
                  「こんなこと、みんな知ってるでしょ」と発信をためらってしまう
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-900">
              <CardContent className="pt-6">
                <Zap className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">完璧主義すぎる</h3>
                <p className="text-muted-foreground">
                  「出す価値があるか？」と自己ツッコミが強く、出せない
                </p>
              </CardContent>
            </Card>
          </div>
          <p className="text-center mt-8 text-lg text-muted-foreground">
            あなたは「発信者」ではない。<strong>「思考装置」</strong>だ。
            <br />
            だから、書こうとすると詰まる。
          </p>
        </div>
      </section>

      {/* 解決策セクション */}
      <section id="concept" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            発想を180度変えよう。
            <br />
            <span className="text-primary">書くのをやめよう。</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            あなたの役割は『観測者』であり『判断者』。
            <br />
            あなたの価値は「考え」ではなく「選び方」にある。
          </p>
        </div>
      </section>

      {/* 仕組みの解説セクション */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            3ステップで思考がコンテンツに
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                1
              </div>
              <Card className="pt-8 h-full">
                <CardContent>
                  <FileText className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-3">観測ログ</h3>
                  <p className="text-muted-foreground">
                    違和感を1行メモするだけ。
                    <br />
                    思考の断片を摩擦なく記録。
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                2
              </div>
              <Card className="pt-8 h-full">
                <CardContent>
                  <Sparkles className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-3">AIコーチ</h3>
                  <p className="text-muted-foreground">
                    AIがあなたの代わりに書く。
                    <br />
                    プロジェクトも提案してくれる。
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                3
              </div>
              <Card className="pt-8 h-full">
                <CardContent>
                  <FolderKanban className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-3">進行中プロジェクト</h3>
                  <p className="text-muted-foreground">
                    溜まったら出すしかない仕組み。
                    <br />
                    習慣ではなく構造で継続。
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ターゲットへの共感セクション */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            「進行中のプロジェクト」という言葉に
            <br />
            ドキっとしたあなたへ
          </h2>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12">
            <p className="text-lg md:text-xl leading-relaxed mb-6">
              岡田斗司夫やひろゆきを見て「いいな」と思ったことはありませんか？
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              彼らは「頑張って発信」なんてしていない。
              <br />
              ただ、思考の過程をそのまま公開しているだけ。
              <br />
              それが結果的に、膨大な影響力になっている。
            </p>
            <p className="text-lg font-medium">
              このシステムは、その「あり方」を再現するためのものです。
              <br />
              <strong className="text-primary">
                あなたの思考を、プロジェクトにしよう。
              </strong>
            </p>
          </div>
        </div>
      </section>

      {/* パートナー機能セクション */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            大切な人に応援してもらおう
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            恋人やパートナーを「サポーター」として招待できます。
            <br />
            あなたの進捗を見守り、応援してもらえる。
            <br />
            一人じゃないから、続けられる。
          </p>
        </div>
      </section>

      {/* 料金プランセクション */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            料金プラン
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="relative">
              <CardContent className="pt-8">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <p className="text-4xl font-bold mb-4">
                  ¥0<span className="text-lg font-normal text-muted-foreground">/月</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    観測ログ無制限
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    AI生成 月10回
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    プロジェクト3つまで
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    パートナー1人
                  </li>
                </ul>
                <Link href="/register" className="block">
                  <Button variant="outline" className="w-full">
                    無料で始める
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="relative border-primary">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                おすすめ
              </div>
              <CardContent className="pt-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className="text-4xl font-bold mb-4">
                  ¥980<span className="text-lg font-normal text-muted-foreground">/月</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    観測ログ無制限
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    AI生成 無制限
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    プロジェクト無制限
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    パートナー無制限
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    X・note連携
                  </li>
                </ul>
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQセクション */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            よくある質問
          </h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">本当に書かなくていいの？</h3>
                <p className="text-muted-foreground">
                  はい。あなたがすることは「観測ログ」を残すことと、AIが生成したコンテンツを「採用」か「却下」するだけです。書くのはAIの仕事です。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">どんな人に向いている？</h3>
                <p className="text-muted-foreground">
                  思考量が多く、頭の中で考えすぎて発信できない人。完璧主義で「出す価値があるか」と迷ってしまう人。ルーチンが苦手で習慣化できない人に最適です。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">プロジェクトはどうやって決まるの？</h3>
                <p className="text-muted-foreground">
                  AIコーチがあなたの観測ログを分析し、繰り返し出現するテーマや独自の視点を見つけ出し、プロジェクトを提案します。あなたはそれを承認するだけです。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 最終CTAセクション */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <Sparkles className="h-16 w-16 text-primary mx-auto mb-8" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            さあ、あなたの思考を
            <br />
            プロジェクトにしよう。
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            無料で始められます。クレジットカード不要。
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-12 py-6 h-auto">
              無料で始める
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="h-5 w-5 text-primary" />
            Project Insight
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Project Insight. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
