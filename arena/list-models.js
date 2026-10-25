// Liste les modèles disponibles chez un fournisseur (les catalogues gratuits changent souvent).
// Usage : npm run arena:models -- groq [filtre]
import { getProvider } from './providers.js';

const [name, filter = ''] = process.argv.slice(2);
const provider = getProvider(name);

const response = await fetch(`${provider.baseUrl}/models`, {
    headers: { Authorization: `Bearer ${provider.apiKey}`, ...provider.headers },
});
if (!response.ok) {
    console.error(`HTTP ${response.status} : ${await response.text()}`);
    process.exit(1);
}
const { data } = await response.json();
data.map(m => m.id)
    .filter(id => id.includes(filter))
    .sort()
    .forEach(id => console.log(id));
