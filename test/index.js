const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { Document, FileLoader, renderToString } = require('../build');

const fixtures = (file) => {
  const p = path.join(__dirname, 'fixtures', file);
  return fs.readFileSync(p, 'utf-8');
}

describe('new document', () => {
  const emptyDocument = { name: '' };
  const emptyHead = { metas: [], styles: [], scripts: [], title: '', icons: [] };
  const emptyBody = {
    content: { loaded: false, inline: true, type: 'text/html', src: '', raw: '' },
    scripts: []
  };

  it('new empty document', () => {
    const doc1 = new Document();
    const doc2 = new Document('invalid');
    assert.deepStrictEqual(doc1.document, emptyDocument);
    assert.deepStrictEqual(doc2.document, emptyDocument);
  });

  it('new document with html', () => {
    const doc0 = new Document({ html: 'test.html' });
    assert.deepStrictEqual(
      doc0.document.html,
      { loaded: false, inline: true, type: 'text/html', src: 'test.html', raw: '' }
    );
  });

  it('new document with head & body', () => {
    const doc1 = new Document({ head: {}, body: {} });
    const doc2 = new Document({
      head: {
        metas: {
          name: 'author', content: 'epii'
        },
        styles: 'test.css',
        scripts: ['test1.js'],
        icons: 'test.png'
      },
      body: {
        content: { raw: '<div id="app"></div>' },
        scripts: [
          'test2.js',
          { src: 'launch.js', inline: true }
        ]
      }
    });
    assert.deepStrictEqual(doc1.document.head, emptyHead);
    assert.deepStrictEqual(doc1.document.body, emptyBody);
    assert.deepStrictEqual(doc2.document.head.metas, [
      { name: 'author', content: 'epii' }
    ]);
    assert.deepStrictEqual(doc2.document.head.styles, [
      { loaded: false, inline: false, type: 'text/css', src: 'test.css', raw: '' }
    ]);
    assert.deepStrictEqual(doc2.document.head.scripts, [
      { loaded: false, inline: false, type: 'application/javascript', src: 'test1.js', raw: '' }
    ]);
    assert.deepStrictEqual(doc2.document.head.icons, [
      { loaded: false, inline: false, type: 'image/png', src: 'test.png', raw: '' }
    ]);
    assert.deepStrictEqual(doc2.document.body.content,
      { loaded: false, inline: true, type: 'text/html', src: '', raw: '<div id="app"></div>' }
    );
    assert.deepStrictEqual(doc2.document.body.scripts, [
      { loaded: false, inline: false, type: 'application/javascript', src: 'test2.js', raw: '' },
      { loaded: false, inline: true, type: 'application/javascript', src: 'launch.js', raw: '' }
    ]);
  });
});

describe('apply loaders', () => {
  it('empty document', () => {
    const doc0 = new Document();
    return doc0.applyLoaders();
  });

  it('use NullLoader', async () => {
    const doc1 = new Document({ html: 'test.html' });
    const doc2 = new Document({
      head: {
        styles: { inline: true, src: 'test.css' },
        scripts: { inline: true, src: 'test.js' }
      },
      body: {
        content: { inline: true, src: 'test.html' }
      }
    });
    await doc1.applyLoaders().then(() => {
      assert.strictEqual(doc1.document.html.loaded, false);
      assert.strictEqual(doc1.document.html.raw, '<!-- epii = loaders not found -->');
    });
    await doc2.applyLoaders().then(() => {
      assert.strictEqual(doc2.document.head.styles[0].loaded, false);
      assert.strictEqual(doc2.document.head.styles[0].raw, '/* epii = loaders not found */');
      assert.strictEqual(doc2.document.head.scripts[0].loaded, false);
      assert.strictEqual(doc2.document.head.scripts[0].raw, '// epii = loaders not found');
      assert.strictEqual(doc2.document.body.content.loaded, false);
      assert.strictEqual(doc2.document.body.content.raw, '<!-- epii = loaders not found -->');
    });
  });

  it('use FileLoader', async () => {
    assert.throws(() => new FileLoader());
    const fileLoader = new FileLoader({
      prefix: '__file',
      source: path.join(__dirname, 'fixtures')
    });
    const doc0 = new Document({
      head: {
        styles: [
          { inline: true, src: 'test.css' },
          { inline: true, src: 'null.css' },
          { inline: false, src: 'http.css' },
        ]
      },
      body: {
        content: { inline: true, src: 'test.html' },
        scripts: [
          { inline: true, src: 'test.js' },
          { inline: true, src: 'null.js' },
          { inline: false, src: 'http.js' }
        ]
      }
    });
    await doc0.applyLoaders([fileLoader]);
    assert.deepStrictEqual(
      doc0.document.head.styles[0],
      { loaded: true, inline: true, type: 'text/css', src: 'test.css', raw: fixtures('test.css') }
    );
    assert.deepStrictEqual(
      doc0.document.head.styles[1],
      { loaded: true, inline: true, type: 'text/css', src: 'null.css', raw: '/* epii = file system error */' }
    );
    assert.deepStrictEqual(
      doc0.document.head.styles[2],
      { loaded: true, inline: false, type: 'text/css', src: '/__file/http.css', raw: '' }
    );
    assert.deepStrictEqual(
      doc0.document.body.content,
      { loaded: true, inline: true, type: 'text/html', src: 'test.html', raw: fixtures('test.html') }
    );
    assert.deepStrictEqual(
      doc0.document.body.scripts[0],
      { loaded: true, inline: true, type: 'application/javascript', src: 'test.js', raw: fixtures('test.js') }
    );
    assert.deepStrictEqual(
      doc0.document.body.scripts[1],
      { loaded: true, inline: true, type: 'application/javascript', src: 'null.js', raw: '// epii = file system error' }
    );
    assert.deepStrictEqual(
      doc0.document.body.scripts[2],
      { loaded: true, inline: false, type: 'application/javascript', src: '/__file/http.js', raw: '' }
    );
  });

  it('use custom loader', async () => {
    // TODO
  });
});

describe('inject and copy', () => {
  it('lost inject', () => {
    const doc1 = new Document({});
    const doc2 = new Document({ html: 'test.html' });
    const copy1 = doc1.getInjectCopy({});
    const copy2 = doc2.getInjectCopy({});
    assert.deepStrictEqual(copy1, { name: '' });
    assert.deepStrictEqual(copy2, { name: '', html: { loaded: false, inline: true, type: 'text/html', src: 'test.html', raw: '' } });
  });

  it('inject data', () => {
    const doc0 = new Document({ head: {}, body: {} });
    const copy1 = doc0.getInjectCopy();
    const copy2 = doc0.getInjectCopy({ text: 'hello world' });
    const copy3 = doc0.getInjectCopy('<script>alert("abc");</script>');
    const copy4 = doc0.getInjectCopy(() => ({}));
    assert.deepStrictEqual(copy1.body.inject, { loaded: true, inline: true, type: 'application/javascript', src: '', raw: 'if(!window.epii)window.epii={};window.epii.state=undefined;' });
    assert.deepStrictEqual(copy2.body.inject.raw, 'if(!window.epii)window.epii={};window.epii.state={"text":"hello world"};');
    assert.deepStrictEqual(copy3.body.inject.raw, 'if(!window.epii)window.epii={};window.epii.state="\\u003Cscript\\u003Ealert(\\"abc\\");\\u003C\\u002Fscript\\u003E";');
    assert.deepStrictEqual(copy4.body.inject.raw, 'if(!window.epii)window.epii={};window.epii.state=undefined;');
  });
});

describe('render document', () => {
  const fileLoader = new FileLoader({
    prefix: '__file',
    source: path.join(__dirname, 'fixtures')
  });

  it('render empty', () => {
    const doc1 = new Document({});
    const txt1 = renderToString(doc1.document);
    assert.strictEqual(txt1, '');

    const doc2 = new Document({ head: {}, body: {} });
    const txt2 = renderToString(doc2.document);
    assert.strictEqual(txt2, fixtures('null.html'));
  });

  it('render document with html', async () => {
    const doc0 = new Document({ html: 'test.html' });
    await doc0.applyLoaders([fileLoader]);
    const text = renderToString(doc0.document);
    assert.strictEqual(text, fixtures('test.html'));
  });

  it('render document with head & body', async () => {
    const doc0 = new Document({
      head: {
        metas: { name: 'author', content: 'epii' },
        title: 'test',
        styles: [
          { inline: true, src: 'test.css' },
          'http.css'
        ],
        scripts: 'http.js',
        icons: 'http.png'
      },
      body: {
        content: { inline: true, src: 'test.html' },
        scripts: { inline: true, src: 'test.js' }
      }
    });
    await doc0.applyLoaders([fileLoader]);
    const text = renderToString(doc0.document);
    assert.strictEqual(text, fixtures('full.html'));
  });
});

