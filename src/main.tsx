import { render } from 'preact';
import { App } from './App';
import './styles/global.css';
import { initAnalytics } from './analytics/gtag';

initAnalytics();

const root = document.getElementById('app');
if (!root) throw new Error('#app mount point not found');
render(<App />, root);
