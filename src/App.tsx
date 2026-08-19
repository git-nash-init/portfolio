import { Route, Switch } from "wouter";
import Portfolio from "./components/Portfolio";
import ProjectsPage from "./pages/Projects";

function App() {
  return (
    <Switch>
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/" component={Portfolio} />
      <Route component={Portfolio} />
    </Switch>
  );
}

export default App;
