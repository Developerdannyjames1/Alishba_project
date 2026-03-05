import { Provider } from "react-redux";
import { store } from "./store/store";
import { AppRoutes } from "./routes";
import "./App.css";

function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  );
}

export default App;
