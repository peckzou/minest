import './index.css';
import { TypingWorldsApp } from './ui/app';

const appEl = document.getElementById('app');
if (appEl) {
  new TypingWorldsApp(appEl);
}
