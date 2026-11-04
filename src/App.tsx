import { lazy, Suspense } from 'react';
import { loadAdmin, loadLogin } from './lib/prefetch';
import { Navigate, Route, Routes, useParams } from 'react-router';
import { Layout } from './components/Layout';
import { isEnabled } from './config/site';
import About from './pages/About';
import { BlogArticle, BlogArticles, BlogFeed, PostDetail } from './pages/Blog';
import Certificates from './pages/Certificates';
import Contact from './pages/Contact';
import Hobbies from './pages/Hobbies';
import Home from './pages/Home';
import Knowhow from './pages/Knowhow';
import KnowhowArticle from './pages/KnowhowArticle';
import { Datenschutz, Impressum } from './pages/Legal';
import NotFound from './pages/NotFound';
import { ProjectDetail, Projects } from './pages/Projects';
import Skills from './pages/Skills';

// The admin area (and with it the upload code) is only downloaded when /admin is opened.
const Admin = lazy(loadAdmin);
const Login = lazy(loadLogin);

function SkillRedirect() {
  const { id } = useParams();
  return <Navigate to={`/skills#skill-${id}`} replace />;
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        {isEnabled('skills') && (
          <>
            <Route path="skills" element={<Skills />} />
            {/* Old skill detail URLs → the skill's card on the skills page */}
            <Route path="skills/:id" element={<SkillRedirect />} />
          </>
        )}
        {isEnabled('knowhow') && (
          <>
            <Route path="knowhow" element={<Knowhow />} />
            <Route path="knowhow/:category" element={<Knowhow />} />
            <Route path="knowhow/:category/:slug" element={<KnowhowArticle />} />
          </>
        )}
        {isEnabled('projects') && (
          <>
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:slug" element={<ProjectDetail />} />
          </>
        )}
        {isEnabled('blog') && (
          <>
            <Route path="blog" element={<BlogFeed />} />
            <Route path="blog/articles" element={<BlogArticles />} />
            <Route path="blog/articles/:slug" element={<BlogArticle />} />
            <Route path="blog/p/:id" element={<PostDetail />} />
          </>
        )}
        {isEnabled('hobbies') && <Route path="hobbies" element={<Hobbies />} />}
        {isEnabled('about') && <Route path="about" element={<About />} />}
        {isEnabled('certificates') && <Route path="certificates" element={<Certificates />} />}
        {isEnabled('contact') && <Route path="contact" element={<Contact />} />}
        <Route path="impressum" element={<Impressum />} />
        <Route path="datenschutz" element={<Datenschutz />} />
        <Route
          path="login"
          element={
            <Suspense fallback={<p className="container-page pt-10 text-muted">Loading…</p>}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="admin"
          element={
            <Suspense fallback={<p className="container-page pt-10 text-muted">Loading…</p>}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
