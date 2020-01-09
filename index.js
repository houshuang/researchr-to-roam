/* eslint-disable */
require('util').inspect.defaultOptions.depth = null;
const fs = require('fs');

const ref = {};
const names = {};
const urls = {};
const pages = fs
  .readdirSync('./pages/ref/')
  .filter(name => name.slice(-4) === '.txt');
pages.forEach(fname => {
  if (!fname.startsWith('__')) {
    const text = fs.readFileSync('pages/ref/' + fname, 'utf-8');
    let citation = undefined;
    const url = text.match(/Retrieved from (.+)/m);
    if (url) {
      urls[fname.split('.')[0]] = url[1].trim().replace('|</ifauth>', '');
    }
    const n = text.match(/author = \{(.+)\}/);
    if (n) {
      names[fname.split('.')[0]] = n[1]
        .split(' and ')
        .map(x => {
          console.log(x, fname);
          if (!x.includes(',')) {
            return `[[${x}]]`;
          }
          nn = x.split(',');

          return `[[${nn[1].trim()} ${nn[0].trim()}]]`;
        })
        .join(', ');
    }
    const cit = text.match(/Citation \|(.+)\^ \</m);
    if (cit && cit.length > 1) {
      citation = cit[1];
    } else {
      citation2 = text.match(/\|(.+)\|</m);
      if (citation2 && citation2.length > 1) {
        citation = citation2[1];
      } else {
        // console.error('failed', text);
      }
    }
    if (citation) {
      ref[fname.split('.')[0]] = citation.replace(/Retrieved from .+/, '');
    }
  }
});
const notes = {};
fs.readdirSync('./pages/notes/')
  .filter(name => name.slice(-4) === '.txt')
  .forEach(fname => {
    const text = fs.readFileSync('pages/notes/' + fname, 'utf-8');
    const textProc = text
      .replace(/::/g, '^^')
      .replace(/([^:])\/\//g, '$1__')
      .replace('h1. Key ideas\n', '')
      .replace(/\[@(.+?)\]/g, '[[$1]]')
      .replace(/\[\[:(.+?)\]\]/g, '[[$1]]')
      .replace(/\[\[(.+)\|(.+)\]\]/g, '[$2]($1)')
      .replace(/\[\[http(.+?)\]\]/g, 'http$1')
      .replace(/(\<\/?blockquote\>)/g, '\n$1\n');
    const textLines = textProc.split('\n');
    let indent = 2;
    const newText = textLines
      .map(line => {
        if (line.startsWith('<blockquote')) {
          const toReturn = '  '.repeat(indent) + 'Quote: ';
          indent += 1;
          return toReturn;
        }
        if (line.trim() === '</blockquote>') {
          indent -= 1;
          return '';
        }
        let hMatch = line.match(/h(\d)\. (.+)/);
        if (line.startsWith('## ')) {
          hMatch = ['', '2', line.slice(3)];
        }
        if (line.startsWith('# ')) {
          hMatch = ['', '1', line.slice(2)];
        }
        if (hMatch) {
          indent = parseInt(hMatch[1], 10) + 2;
          const toReturn = '  '.repeat(indent - 1) + hMatch[2];
          return toReturn;
        }
        return '  '.repeat(indent) + line;
      })
      .join('\n');
    notes[fname.split('.')[0]] = newText;
  });

Object.keys(ref).forEach(n => {
  let result = ref[n] + '\n';
  if (names[n]) {
    result += '  - Authors: ' + names[n] + '\n';
  }
  if (urls[n]) {
    result += '  - Source: ' + urls[n] + '\n';
  }
  if (notes[n]) {
    result += '  - Notes: \n' + notes[n] + '\n';
  }
  fs.writeFileSync('export/' + n + '.md', result);
});
