DEBUG = true;



/*
coder.onkeyup = function () {
   // console.log('f',f);
    f.srcdoc = thtml.value + `<script>${tjs.value}</script><style>`;
};*/


function BuildSample(js='',html='',css='') {

    let str = `<div class="coder row">`;
    if (html !== '')
        str += `<pre class="coder-item html"><code class="code-html language-html" contenteditable="false">${html.replace(/</g,'&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    if (js !== '')
        str += `<pre class="coder-item js"><code class="code-js language-js"     contenteditable="false">${js.replace(/</g,'&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    if (css !== '')
        str += `<pre class="coder-item css"><code class="code-css language-css"   contenteditable="false">${css}</code></pre>`;

    str += `<div class="coder-item pre-preview"><div class="preview flex-100"><iframe class="iframe" style="height: 100%;"></iframe></div></div></div>`;

    let x = Lure.CreateElementFromString(str);

    let elementHtml =  Lure.Select('.code-html',x);
    let elementJs =  Lure.Select('.code-js',x);
    let elementCss =  Lure.Select('.code-css',x);
    if (elementHtml)
    {
        elementHtml.innerHTMLs = html;
        hljs.highlightBlock(Lure.Select('.code-html',x));
    }
    if (elementJs)
    {
        elementJs.innerHTMLs = js;
        hljs.highlightBlock(Lure.Select('.code-js',x));
    }
    if (elementCss)
    {
        elementCss.innerHTMLs = css;
        hljs.highlightBlock(Lure.Select('.code-css',x));
    }
    let res = '';
    res += '<!doctype html>';
    res += '<html>';
    res += '<head>';
    res += '<link rel="stylesheet" type="text/css" href="https://dimonlastname.github.io/lure/lure/lure.css" />\r\n';
    res += `<style>${css}</style>`;
    res += '<script src="https://dimonlastname.github.io/monsieur/lure/lure.all.min.js"></script>\r\n';
    res += '</head><body>';
    res += '<div></div>';// if remove row, <body> tag would be undefined
    res += html;
    res += `<script>${js}</script>`;
    res += '</body></html>';
    Lure.Select('.iframe', x).srcdoc = res;

    return x;
}

//Lure.Select('#kuka').appendChild( BuildSample('<div></div>', sa.js,'')  ) ;




/*
 <script src="https://dimonlastname.github.io/monsieur/ext/monsieur/monsieur.js"></script>
 <script>let hello = new MonsieurContent({
 Target: 'body',
 Content: `<div class="sample hello">Hello World!</div>`
 });
 </script>
 */






Lure.Perf(t, "ready");