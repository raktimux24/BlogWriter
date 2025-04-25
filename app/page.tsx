import type { Metadata } from "next"
import PageContainer from "@/components/layout/page-container"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import CardContainer from "@/components/layout/card-container"
import UrlForm from "@/components/home/url-form"

export const metadata: Metadata = {
  title: "BlogWriter | Generate Blog Posts",
  description: "Generate beautiful blog posts from URLs using AI",
}

export default function Home() {
  return (
    <PageContainer>
      <Header
        showTitle={true}
        centered={true}
        description="Transform content from around the web into beautifully written blog posts in seconds."
      />

      <CardContainer>
        <UrlForm />
      </CardContainer>

      <Footer />
    </PageContainer>
  )
}
