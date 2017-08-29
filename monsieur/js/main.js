DEBUG = true;
Monsieur.PerformanceNow(t, "PageLoaded");
Monsieur.Compile1 = function (line) {

    console.log(line);
    line = line.replace(/{{#endeach}}/g, `\`;};
       line +=\``);

    let i = "";
    let count = 0;
    //line = line(/{this}/g, "$this");
    line = line.replace(/{{#each\s+([^}]+)}}/g, function(a,name){
        let previ="";
        /*if (count > 0)
            previ = `let i${"i".repeat(count)} = i;
            //let ii${i} = ii;`;*/
      /*  for (let k =0; k<count;k++){
            previ += `let i${"i".repeat(count- k)} = ${"i".repeat(count-k)};
        `
        }*/
        count++;
        return `\`;
        //count=${count-1}
       // ${previ}
        
        for (let i${count} in ${name}){
        let $this = ${name}[i${count}];
        let i = i${count};
        let n = i*1+1;
        line +=\``;
    });


    line = `let line = \`${line}\`
    return line;`;
    console.log(line);
    let f = new Function('o', 'i', '$num', '$denum', line);
    console.log(f);
    return f;
};


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

    let x = Monsieur.CreateElementFromString(str);

    let elementHtml =  Monsieur.Select('.code-html',x);
    let elementJs =  Monsieur.Select('.code-js',x);
    let elementCss =  Monsieur.Select('.code-css',x);
    if (elementHtml)
    {
        elementHtml.innerHTMLs = html;
        hljs.highlightBlock(Monsieur.Select('.code-html',x));
    }
    if (elementJs)
    {
        elementJs.innerHTMLs = js;
        hljs.highlightBlock(Monsieur.Select('.code-js',x));
    }
    if (elementCss)
    {
        elementCss.innerHTMLs = css;
        hljs.highlightBlock(Monsieur.Select('.code-css',x));
    }
    let res = '';
    res += '<!doctype html>';
    res += '<html>';
    res += '<head>';
    res += '<link rel="stylesheet" type="text/css" href="https://dimonlastname.github.io/monsieur/ext/monsieur/monsieur.css" />\r\n';
    res += '<link rel="stylesheet" type="text/css" href="https://dimonlastname.github.io/monsieur/ext/css/common.css" />\r\n';
    res += `<style>${css}</style>`;
    res += '<script src="https://dimonlastname.github.io/monsieur/ext/monsieur/monsieur.js"></script>\r\n';
    res += '</head><body>';
    res += '<div></div>';// if remove row, <body> tag would be undefined
    res += html;
    res += `<script>${js}</script>`;
    res += '</body></html>';
    Monsieur.Select('.iframe', x).srcdoc = res;

    return x;
}

//Monsieur.Select('#kuka').appendChild( BuildSample('<div></div>', sa.js,'')  ) ;




/*
 <script src="https://dimonlastname.github.io/monsieur/ext/monsieur/monsieur.js"></script>
 <script>let hello = new MonsieurContent({
 Target: 'body',
 Content: `<div class="sample hello">Hello World!</div>`
 });
 </script>
 */






