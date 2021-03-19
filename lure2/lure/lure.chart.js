Lure.Plugin.Chart = {
    Core: '',
    Chart: class LureChart{
        constructor(
            Target = null,      //where render chart
            {
                Type = 'Line',  //Line Bar Pie
                Title = '',
                Labels = {
                    Rotation: 'auto',
                    Data: []
                },
                Series = [
                    {Data: [], Type: '', OwnAxis: false, Color: '#eee'},
                    {Data: [], Type: '', OwnAxis: [0, 100], Color: '#eee'},
                ],
                Tooltip = {
                    Template: 'Name: {{Name}}<br>Value: {{Value}}',
                },
                AxisY = {
                    Scale: ['auto', 'auto', 'auto'],
                    Visible: true,
                },
                Height = 400,
                SeriesOptions = {},
            }={},
        ){
            /// <DEFAULTS>
            //const Colors = ['red', 'green', 'blue'];
            const ColorsDefault = ['red', 'green', 'cornflowerblue', 'purple', 'palevioletred', 'orange'];
            //const DefaultPoint = {
            //    Visible: true,
            //    Radius: 4
            //};
            /// </DEFAULTS>
            ///
            let chart = this;
            this.Content = Lure.Select(Target);
            this.Content.classList.add('mt-chart'); // mt
            this.Content.style.position = 'relative';

            this.isGraph = true;//(Series.filter(x=>x.Type?x.Type.toLowerCase():x.Type === 'line' || x.Type?x.Type.toLowerCase():x.Type === 'bar')).length === Series.length;

            let Buffer = {
                Legend: '',
                AxisX: '',
                AxisY: '',
                Grid: '',
                Svg: '',



                Height: 0,
                Width: 0,
                Abscissa: null,
                SeriesPoints: [],

                ParametersAxisX: null,

            };

            this._Series = Series;
            //define Series
            this.__InitSeries = function (){
                let Se = [];

                for (let i = 0; i < this._Series.length; i++){
                    let ep = {};
                    ep.Name    = this._Series[i].Name ? this._Series[i].Name                : 'Unnamed';
                    ep.Data    = this._Series[i].Data;
                    ep.OwnAxis = this._Series[i].OwnAxis;
                    ep.Title   = this._Series[i].Title? this._Series[i].Title               : ep.Name;
                    ep.Type    = this._Series[i].Type ? this._Series[i].Type.toLowerCase()  : (Type?Type.toLowerCase():'line');
                    ep.Color   = this._Series[i].Color? this._Series[i].Color: ColorsDefault[i]?ColorsDefault[i]:'#000';
                    ep.Width   = this._Series[i].Width? this._Series[i].Width               : 2;

                    ep.Point   = Series[i].Point;
                    ep.Point   = Lure.Chart.GetSeriePointOptions(ep);

                    Buffer.Legend += Lure.Chart.MakeLegend(ep, i);
                    Se.push(ep)
                }
                return Se;
            }.bind(this);

            this.Options = {
                //Type: Type? Type.toLowerCase(): 'line',
                Title: Title? Title: '',
                Labels: {
                    Visible: (typeof Labels.Visible === 'undefined' || Labels.Visible),
                    Rotation: Labels.Rotation? Labels.Rotation: 'auto',
                    Data: Labels.Data? Labels.Data: [],
                },
                Series: this.__InitSeries(),
                SeriesOptions: {
                    BarStack: false,
                    BarGradient: true
                },
                AxisY: {
                    Scale: AxisY.Scale? ([Lure.isNumeric(AxisY.Scale[0])? AxisY.Scale[0]:'auto', Lure.isNumeric(AxisY.Scale[1])? AxisY.Scale[1]:'auto', Lure.isNumeric(AxisY.Scale[2])? AxisY.Scale[2]:'auto']):['auto', 'auto', 'auto'],
                    Visible: (typeof AxisY.Visible === 'undefined' || AxisY.Visible)
                },
                Tooltip: {
                    Template: Tooltip.Template?Tooltip.Template : 'Name: {{Name}}<br>Value: {{Value}}'
                }
            };
            this.Block = (function () {
                this.Content.innerHTML = `<div class="mt-chart col">
                                        <div class="mt-chart-caption">
                                          <div class='mt-chart-title'>${Title}</div>
                                          <div class="mt-chart-legend row"></div>
                                        </div>
                                        <div class="mt-chart-kek row flex-100">
                                          <div class="mt-chart-y row"></div>
                                          <div class="col flex-100">
                                            <div class="mt-chart-area row flex-100">
                                              <svg class="mt-chart-svg"></svg>
                                              <div class="mt-chart-grid" style=" position: absolute;"></div>
                                            </div>
                                            <div class="mt-chart-x row"></div>
                                           </div>
                                        </div>
                                      </div>`;
                const _Legend     = this.Content.querySelector('.mt-chart-legend');
                const _AxisX      = this.Content.querySelector('.mt-chart-x');
                const _AxisY      = this.Content.querySelector('.mt-chart-y');
                const _ChartArea  = this.Content.querySelector('.mt-chart-area');
                const _Grid       = this.Content.querySelector('.mt-chart-grid');
                const _Svg        = this.Content.querySelector('.mt-chart-svg');
                return {
                    get Legend(){
                        return _Legend;
                    },
                    set Legend(v){
                        _Legend.innerHTML = v;
                    },
                    get AxisX(){
                        return _AxisX;
                    },
                    set AxisX(v){
                        _AxisX.innerHTML = v;
                    },
                    get AxisY(){
                        return _AxisY;
                    },
                    set AxisY(v){
                        _AxisY.innerHTML = v;
                    },
                    get ChartArea(){
                        return _ChartArea;
                    },
                    set ChartArea(v){
                        _ChartArea.innerHTML = v;
                    },
                    get Grid(){
                        return _Grid;
                    },
                    set Grid(v){
                        _Grid.innerHTML = v;
                    },
                    get Svg(){
                        return _Svg;
                    },
                    set Svg(v){
                        _Svg.innerHTML = v;
                    },
                }
            }.bind(this))();

            /********************************************************************************/
            const Builders = {
                /**
                 *
                 * @param Serie
                 * @param i
                 * @returns {string}
                 * @constructor
                 */
                MakeLegend(Serie, i){
                    return `<div class="mt-chart-legend__item row">
                          <input class="mt-legend-checkbox" type="checkbox" checked="checked" id="legcheck${Serie.Name}${i}">
                          <div class="mt-legend-icon" style="background-color: ${Serie.Color}"></div>
                          <label class="mt-legend-label" for="legcheck${Serie.Name}${i}">${Serie.Name}</label>
                        </div>`;
                },
                /**
                 *
                 * @param scale
                 * @param i
                 * @param name
                 * @param color
                 * @returns {*}
                 * @constructor
                 */
                MakeAxisY(){
                    /*if (!scale)
                     return '';
                     let caption = '';
                     if (i>0)
                     caption = `<div class="mt-chart-axis-caption"><div style="transform: rotate(-90deg)">${name}</div></div>`;
                     let a = '';
                     for (let j = 0; j< scale.length; j++){
                     a += `<div class="mt-chart-label mt-chart-label__y"><span>${scale[j]}</span></div>`;
                     }
                     return `<div class="mt-chart-axis__y row" ${(i>0)? ('style="color: '+color+'; font-weight: bold;"'):''} data-line="${i}">${caption}<div class="mt-chart-labels col">${a}</div></div>`;*/
                    let i = 0;
                    if (!chart.Options.AxisY.Visible){
                        i = 1;
                        if (chart._ScaleY.Scales.length < 2)
                            return '';
                    }
                    let accum = '';
                    for (i; i <chart._ScaleY.Scales.length; i++){
                        let index = chart._ScaleY.Dict.indexOf(i);//.filter(x=>x===i && x !==0)[0];
                        let scale = chart._ScaleY.Scales[i];
                        let caption = '';
                        //let a = '';
                        if (i>0)
                            caption = `<div class="mt-chart-axis-caption"><div style="transform: rotate(-90deg)">${chart.Options.Series[index].Title}</div></div>`;
                        let a = '';
                        for (let j = 0; j< scale.length; j++){
                            a += `<div class="mt-chart-label mt-chart-label__y"><span>${scale[j]}</span></div>`;
                        }
                        accum += `<div class="mt-chart-axis__y row" ${(i>0)? ('style="color: '+chart.Options.Series[index].Color+'; font-weight: bold;"'):''} data-line="${i}">${caption}<div class="mt-chart-labels col">${a}</div></div>`;

                    }
                    return accum;
                },
                MakeAxisX(){
                    if (!chart.Options.Labels.Visible)
                        return '';
                    let labels = chart.Options.Labels.Data;

                    const style = `transform: rotate(${Buffer.ParametersAxisX.Angle}deg); margin-top: ${Buffer.ParametersAxisX.MarginTop}px; width: ${Buffer.ParametersAxisX.Width}px; margin-left: ${Buffer.ParametersAxisX.MarginLeft}px;`;
                    let a = '';
                    for (let i = 0 ; i < labels.length; i++){
                        a += `<div class="mt-chart-label mt-chart-label__x"><span style="${style}">${labels[i]}</span></div>`
                    }
                    //console.log(`AxisX forecastHeight: ${Math.round(h/4+ (Math.sqrt(Math.pow(wFact, 2) - Math.pow(w, 2))))}`);
                    return a;
                },
                MakeGrid(a,b){
                    return Lure.Chart.GetGrid(a,b);
                },
                MakeGraph(serie, i){
                    let index = chart._ScaleY.Dict[i];
                    let scale = chart._ScaleY.Scales[index];
                    let mm = chart._ScaleY.MinMax[index];
                    let DataOrdinata = Lure.Chart.GetOrdinata(serie.Data, scale, mm, chart.Height);
                    let DataAbscissa = Lure.Chart.GetAbscissa(chart.Options.Labels.Data, chart.Width);
                    let points = Lure.Chart.GetPoints(DataAbscissa, DataOrdinata);
                    return Lure.Chart.GetPath(points, chart.Options.Series[i].Type, i, chart.Options.Series[i].Color, chart.Options.Series[i].Width);
                },
                CalcAxisX(){
                    let c = Lure.CreateElementFromString(`<div class="mt-chart-label mt-chart-label__x"><span>${chart.Options.Labels.Data[0]}</span></div>`);
                    let size = Lure.GetInlineSize(c, getComputedStyle(c.querySelector('span')).fontSize);
                    let w = chart.Width/chart.Options.Labels.Data.length;
                    let h = size.height;
                    let wFact = size.width;
                    let angle;
                    if (chart.Options.Labels.Rotation !== 'auto'){
                        angle = parseFloat(chart.Options.Labels.Rotation);
                    }
                    else{
                        let cos = (w-h)/(wFact+h);
                        if (cos < 0.1)
                            cos = 0;
                        if (cos > 1)
                            cos = 1;
                        angle = (-90*(1-cos));
                    }
                    return {
                        Height: Math.round(h/4+ (Math.sqrt(Math.pow(wFact, 2) - Math.pow(w, 2)))),
                        Width: wFact,
                        MarginTop:  (wFact>w)? ((Math.sqrt(Math.pow(wFact, 2) - Math.pow(w, 2))) - h) : 0,
                        MarginLeft: (wFact>w)? (-w/2):(-wFact/2),
                        Angle: angle,
                    }

                }
            };
            /**
             *
             * @returns {string}
             * @constructor
             */
            function Builder(){
                let Legend = '';
                let AxeY = '';
                let AxeX = '';
                let Grid = '';
                let Svg = '';

                const isGraph = (chart.Options.Series.filter(x=>x.Type === 'pie')).length !== chart.Options.Series.length;
                console.log('isGraph',isGraph);
                let PathBuilder;
                if (isGraph)
                    PathBuilder = Builders.MakeGraph;

                for (let i = 0; i < chart.Options.Series.length; i++){
                    Legend += Builders.MakeLegend(chart.Options.Series[i], i);
                    AxeY += Builders.MakeAxisY(chart._ScaleY.Scales[i], i, chart.Options.Series[chart._ScaleY.Dict[i]].Title? chart.Options.Series[chart._ScaleY.Dict[i]].Title:chart.Options.Series[chart._ScaleY.Dict[i]].Name, chart.Options.Series[chart._ScaleY.Dict[i]].Color);
                    Svg += PathBuilder(chart.Options.Series[i], i);
                }
                Legend = `<div class="mt-chart-legend row">${Legend}</div>`;
                AxeY = `<div class="mt-chart-y row">${AxeY}</div>`;
                AxeX = Builders.MakeAxisX();
                Grid = Builders.MakeGrid(chart.Options.Labels.Data.length, chart._ScaleY.Scales[0].length-1);
                chart.Content.innerHTML= `<div class="mt-chart col">
                        <div class="mt-chart-caption">
                          <div class='mt-chart-title'>${Title}</div>
                          <div class="mt-chart-legend row">${Legend}</div>
                        </div>
                        <div class="mt-chart-kek row flex-100">
                          <div class="mt-chart-y row">${AxeY}</div>
                          <div class="col flex-100">
                            <div class="mt-chart-area row flex-100">
                              <svg class="mt-chart-svg">${Svg}</svg>
                              <div class="mt-chart-grid" style=" position: absolute;">${Grid}</div>
                            </div>
                            <div class="mt-chart-x row">${AxeX}</div>
                           </div>
                        </div>
                      </div>`
            }

            this.__GetPath = function(serie, line){
                //debugger;
                switch (serie.Type){
                    case 'line':
                        return this.__GetPathLine(serie, line);
                    case 'bar':
                        return this.__GetPathBar(serie, line);
                    case 'pie':
                        return '';
                }
            }.bind(this);
            this.__GetPathLine = function (serie, line) {
                if (!Buffer.Abscissa || Buffer.Width !== this.Width)
                    Buffer.Abscissa = Lure.Chart.GetAbscissa(chart.Options.Labels.Data, this.Width);
                let index = this._ScaleY.Dict[line];
                let scale = this._ScaleY.Scales[index];
                let mm = chart._ScaleY.MinMax[index];
                //debugger;
                let DataOrdinata = Lure.Chart.GetOrdinata(serie.Data, scale, mm, chart.Height);
                let points = Lure.Chart.GetPoints(Buffer.Abscissa, DataOrdinata);
                Buffer.SeriesPoints[line] = points;

                const n = points.length;

                let xs = [];        //x
                let ys = [];        //y
                let dys = [];       //dx
                let dxs = [];       //dy
                let ds = [];        //derivative
                let ms = [];        //desired slope (m) at each point using Fritsch-Carlson method
                for(let i = 0; i < n; i++) {
                    xs[i] = points[i][0];
                    ys[i] = points[i][1];
                }
                // Calculate deltas and derivative
                for(let i = 0; i < n - 1; i++) {
                    dys[i] = ys[i + 1] - ys[i];
                    dxs[i] = xs[i + 1] - xs[i];
                    ds[i] = dys[i] / dxs[i];
                }
                // Determine desired slope (m) at each point using Fritsch-Carlson method
                // See: http://math.stackexchange.com/questions/45218/implementation-of-monotone-cubic-interpolation
                ms[0] = ds[0];
                ms[n - 1] = ds[n - 2];
                for(let i = 1; i < n - 1; i++) {
                    if(ds[i] === 0 || ds[i - 1] === 0 || (ds[i - 1] > 0) !== (ds[i] > 0)) {
                        ms[i] = 0;
                    } else {
                        ms[i] = 3 * (dxs[i - 1] + dxs[i]) / (
                            (2 * dxs[i] + dxs[i - 1]) / ds[i - 1] +
                            (dxs[i] + 2 * dxs[i - 1]) / ds[i]);
                        if(!isFinite(ms[i])) {
                            ms[i] = 0;
                        }
                    }
                }
                let d = `M ${xs[0]},${ys[0]}`;
                let dots = '<g class="mt-chart-dots">';
                for(let i = 0; i < n - 1; i++) {
                    d += ` C ${xs[i] + dxs[i] / 3},${ys[i] + ms[i] * dxs[i] / 3} ${xs[i + 1] - dxs[i] / 3},${ys[i + 1] - ms[i + 1] * dxs[i] / 3} ${xs[i + 1]},${ys[i + 1]}`;
                    if (serie.Point.Visible)
                        dots += Lure.Chart.GetPathLineDot(xs[i] , ys[i], line, i, serie.Color, serie.Point.Radius );
                }
                if (serie.Point.Visible)
                    dots += Lure.Chart.GetPathLineDot(xs[n-1] , ys[n-1], line, n-1, serie.Color, serie.Point.Radius );
                dots += '</g>';
                return `<g class="mt-chart-serie"><path data-line="${line}" d="${d}" fill="none" stroke="${serie.Color}" stroke-width="${serie.Width}"></path> ${dots}</g>`;

            }.bind(this);
            this.__GetPathBar = function (serie, line) {
                if (!Buffer.Abscissa || Buffer.Width !== this.Width)
                    Buffer.Abscissa = Lure.Chart.GetAbscissa(chart.Options.Labels.Data, this.Width);
                let index = this._ScaleY.Dict[line];
                let scale = this._ScaleY.Scales[index];
                let mm = chart._ScaleY.MinMax[index];
                //debugger;
                let DataOrdinata = Lure.Chart.GetOrdinata(serie.Data, scale, mm, chart.Height);
                let points = Lure.Chart.GetPoints(Buffer.Abscissa, DataOrdinata);
                Buffer.SeriesPoints[line] = points;
                let height = this.Height;
                let wd = serie.Width;


                let bricks = '<g class="mt-chart-serie" data-type="Bar">';
                let GradientId = '';
                if (this.Options.SeriesOptions.BarGradient){
                    GradientId = 'bar_' + Math.random().toString(36).replace("0.", '');
                    bricks += `<linearGradient id="${GradientId}"  x1="0" y1="0%"><stop offset="0%" stop-color="rgba(0,0,0,0.2)"/><stop offset="33%" stop-color="rgba(255,255,255,0.2)"/><stop offset="100%" stop-color="rgba(0,0,0,0.3)"/></linearGradient>`;
                }
                // let d = `M ${points[0][0]}  ${points[0][1]}`;

                let dots = '';
                for (let i = 0; i < points.length; i++){
                    let d =`M ${points[i][0]-wd/2} ${height} L ${(points[i][0]+wd/2)} ${height} ${(points[i][0]+wd/2)} ${points[i][1]} ${points[i][0]-wd/2} ${points[i][1]}Z`;
                    // debugger;
                    bricks += `<path class="mt-chart-tooltipable" data-line="${line}" data-item="${i}" d="${d}" fill="${serie.Color}" stroke="#000" stroke-width="0"></path>`;
                    if (this.Options.SeriesOptions.BarGradient)
                        bricks += `<path class="mt-chart-tooltipable"  data-line="${line}" data-item="${i}" d="${d}" fill="url(#${GradientId})" ></path>`;
                    //dots += Lure.Chart.GetPathLineDot(points[i][0] , points[i][1], line, i, serie.Color, serie.Point.Radius );
                }
                bricks += dots+'</g>';
                return bricks;
            }.bind(this);


            (function Init(){
                /* let Legend = '';
                 for (let i = 0; i < this.Options.Series.length; i++){
                 Legend += Lure.Chart.MakeLegend(this.Options.Series[i], i);
                 }*/
                this.Block.Legend = Buffer.Legend;
                Buffer.ParametersAxisX = Builders.CalcAxisX();
                console.log('this.Height-Buffer.ParametersAxisX.Height',this.Height,Buffer.ParametersAxisX.Height);
                this._ScaleY = Lure.Chart.GetScaleY(this.Options.Series, (this.Height-Buffer.ParametersAxisX.Height), this);

                this.Block.AxisX = Builders.MakeAxisX();
                this.Block.Grid  = Lure.Chart.GetGrid(this.Options.Labels.Data.length, this._ScaleY.Scales[0].length-1);

                const isGraph = this.isGraph;
                console.log('isGraph',isGraph);
                let PathBuilder;
                if (isGraph)
                    PathBuilder = Builders.MakeGraph;
                let AxeY = '';
                //let Svg = '';
                let SvgBar = '';
                let SvgLine = '';

                /*
                 for (let i = 0; i < chart._ScaleY.Scales.length; i++){
                 let index = this._ScaleY.Dict[i];
                 //debugger;
                 AxeY += Builders.MakeAxisY(chart._ScaleY.Scales[index], i, chart.Options.Series[i].Title, chart.Options.Series[i].Color);
                 }*/
                AxeY = Builders.MakeAxisY();
                this.Block.AxisY = AxeY;
                for (let i = 0; i < chart.Options.Series.length; i++){

                    //AxeY += Builders.MakeAxisY(chart._ScaleY.Scales[i], i, chart.Options.Series[chart._ScaleY.Dict[i]].Title? chart.Options.Series[chart._ScaleY.Dict[i]].Title:chart.Options.Series[chart._ScaleY.Dict[i]].Name, chart.Options.Series[chart._ScaleY.Dict[i]].Color);
                    //Svg += PathBuilder(chart.Options.Series[i], i);
                    switch (chart.Options.Series[i].Type){
                        case 'line':
                            SvgLine += this.__GetPathLine(chart.Options.Series[i], i);
                            break;
                        case 'bar':
                            SvgBar += this.__GetPathBar(chart.Options.Series[i], i);
                            break;
                    }
                    //Svg += this.__GetPath(chart.Options.Series[i], i);
                    // this.__GetPath(chart.Options.Series[i], i)
                }


                this.Block.Svg   = SvgBar+SvgLine;



                this.Block.AxisY.style.height = this.Height+'px';


                //console.log(`AxisX FactHeight: ${this.Block.AxisX.clientHeight}`);
                // this.Block.AxisX.style.height = this.BuidlerData.AxisXOptions.Height+'px';

            }.bind(this))();
            /********************************************************************************/
            /*******/



            /*<tooltips>*/
            this.Tooltip = new Lure.Content({
                Name: 'Tooltipchek',
                Target: this.Block.ChartArea,
                Content: `<div class="mt-chart-tooltip">
                        <div class="val">${this.Options.Tooltip.Template}</div>
                      </div>`,
                Visible: false,
                Controller: {
                    Data: {},
                },
                BeforeShow: function (a,b) {

                },
                Prop: function () {
                    this._Timer = null;
                    this._Timer2 = null;
                },
                Shower: function () {
                    clearTimeout(this._Timer);
                    clearTimeout(this._Timer2);
                    this.Content.style.display = '';
                    this.Content.style.opacity = '1';
                },
                Hider: function () {
                    clearTimeout(this._Timer);
                    this._Timer = setTimeout(
                        function () {
                            this.Content.style.opacity = '0';
                            this._Timer2 = setTimeout(function () {
                                this.Content.style.display = 'none';
                            }.bind(this), 200)

                        }.bind(this), 500);
                },
                Show: function (options) {
                    clearTimeout(this._Timer);
                    this.Data.Name = options.data[0];
                    this.Data.Value = options.data[1];
                    this.Refresh();
                    this.Content.style.left = (options.pos[0] + 7)+"px";
                    this.Content.style.top = (options.pos[1] - this.Content.clientHeight - 7)+"px";
                    this.Content.style.backgroundColor = options.color;
                    //this._Timer = setTimeout(this.Hide, 2000);
                },
                Methods: function () {
                    this.Do = function (e) {
                        let tag = e.currentTarget.tagName.toLowerCase();
                        switch (tag){
                            case 'circle':
                                this.DoCircle(e);
                                break;
                            case 'path':
                                this.DoBar(e);
                                break;

                        }


                    }.bind(this);
                    this.DoCircle = function (e) {
                        let circle = e.currentTarget;
                        let i = parseInt(circle.dataset['line']);
                        let j = parseInt(circle.dataset['item']);
                        let color = circle.attributes['stroke'].value;
                        //console.log(` parseInt(circle.attributes['r'].value`,  parseInt(circle.attributes['r'].value) );
                        let width = parseInt(circle.attributes['stroke-width'].value);
                        circle.attributes['fill'].value = color;
                        circle.attributes['r'].value = parseInt(circle.attributes['r'].value) + width;
                        circle.attributes['stroke'].value = "#fff";


                        //console.log('', i, j, Buffer.SeriesPoints[i][j], [e.offsetX, e.offsetY]);
                        let o = {
                            data: [Series[i].Name, Series[i].Data[j]],
                            color: color,
                            pos: Buffer.SeriesPoints[i][j]  //[e.offsetX, e.offsetY]
                        };
                        this.Show(o);
                    }.bind(this);
                    this.DoBar = function (e) {
                        let bar = e.currentTarget;
                        let i = parseInt(bar.dataset['line']);
                        let j = parseInt(bar.dataset['item']);

                        // bar.attributes['stroke-width'].value = 2;

                        //console.log('', i, j, Buffer.SeriesPoints[i][j], [e.offsetX, e.offsetY]);

                        let o = {
                            data: [chart.Options.Series[i].Name, chart.Options.Series[i].Data[j]],
                            color: chart.Options.Series[i].Color,
                            pos: Buffer.SeriesPoints[i][j]  //[e.offsetX, e.offsetY]
                        };
                        this.Show(o);
                    }.bind(this);

                },
                AfterBuild: function () {

                }
            });
            Lure.AddEventListenerGlobal('mouseover', '.mt-chart-point, .mt-chart-tooltipable', function (e) {
                this.Tooltip.Do(e);
            }, this.Content, this);
            Lure.AddEventListenerGlobal('mouseout', '.mt-chart-point', function (e) {
                //console.log(e.currentTarget.dataset['tooltip']);
                let circle = e.currentTarget;
                let width = parseInt(circle.attributes['stroke-width'].value);
                circle.attributes['stroke'].value = circle.attributes['fill'].value;
                circle.attributes['fill'].value = "#fff";
                circle.attributes['r'].value -= width;
                chart.Tooltip.Hide();
            }, this.Content);
            /*</tooltips>*/

            const getSuperdata = function () {
                let superdata = [];
                for (let i =0; i< Series.length; i++){
                    let index = this._ScaleY.Dict[i];
                    let scale = this._ScaleY.Scales[index];
                    let mm = this._ScaleY.MinMax[index];
                    let DataOrdinata = Lure.Chart.GetOrdinata(Series[i].Data, scale, mm, this.Block.Svg.Height);
                    this._Abscissa = Lure.Chart.GetAbscissa(Labels.Data, this.Block.Svg.Width);
                    let points = Lure.Chart.GetPoints(this._Abscissa, DataOrdinata);
                    let h = 0;//
                    superdata[i] = {
                        h: this.Block.Svg.Height,
                        Name: chart.Options.Series[i].Name,
                        Data: chart.Options.Series[i].Data,
                        DataPoints: points,
                        Color: chart.Options.Series[i].Color,
                        Path: Lure.Chart.GetPath(points, chart.Options.Series[i].Type, i, chart.Options.Series[i].Color, chart.Options.Series[i].Width),
                        Width: chart.Options.Width,
                        options:{
                            pointSize: Series[i].Width? 4+Series[i].Width/4: 4
                        }
                    }
                }
                chart.SuperData = superdata;
                return superdata;
            }.bind(this);

            this.TestB = function () {
                let per = performance.now();
                Builder();
                Lure.Perf(per, 'builder');
            };
            this.Refresh = function () {


            }.bind(this);
            this.Refresh();
            setTimeout(function(){

            }.bind(this), 0);

            this.Buffer = Buffer;
        }
        get Height(){
            //return this.__svg.clientHeight;
            return this.Block.Svg.clientHeight;
        }
        get Width(){
            return this.Block.Svg.clientWidth;
            //return this.__svg.clientWidth;
        }



        /*statics*/
        static GetSeriePointOptions(serie, isGraph){
            let p = serie.Point ? serie.Point : {};
            p.Visible = (typeof p.Visible === 'undefined' || p.Visible);
            p.Radius = p.Radius? p.Radius : (4+serie.Width/4);
            if (Number.isNaN(p.Radius))
                debugger;
            return p;
        }

        static GetScaleY(series, height, ctx){
            if (ctx.Type === 'pie'){
                return [];
            }
            let min = series[0].Data[0];
            let max = series[0].Data[0];
            let isAutoScale = true;
            let isAutoStep = true;
            if (ctx.Options.AxisY.Scale[0] !== 'auto' && ctx.Options.AxisY.Scale[1] !== 'auto')
            {
                isAutoScale = false;
                min = ctx.Options.AxisY.Scale[0];
                max = ctx.Options.AxisY.Scale[1];
            }
            if (ctx.Options.AxisY.Scale[2] !== 'auto')
                isAutoStep = false;
            let mm = [ [series[0].Data[0],series[0].Data[0]] ];
            let index = 0;
            let scales = [];

            let sc = {
                Scales: [],
                Dict: [],
                MinMax: null
            };
            for (let i = 0; i < series.length; i++){
                sc.Dict[i] = 0;
                if (series[i].OwnAxis){
                    index++;
                    if (typeof series[i].OwnAxis[0] !== 'undefined')
                        mm.push(series[i].OwnAxis);
                    else
                        mm.push([series[i].Data[0],series[i].Data[0]]);
                    sc.Dict[i] = index;
                }
                for (let j = 0; j < series[i].Data.length; j++){
                    if (isAutoScale){
                        if (series[i].Data[j] < min)
                            min = series[i].Data[j];
                        if (series[i].Data[j] > max)
                            max = series[i].Data[j];
                    }
                    if (series[i].OwnAxis && typeof series[i].OwnAxis[0] === 'undefined'){
                        if (series[i].Data[j] < mm[index][0])
                            mm[index][0] = series[i].Data[j];
                        if (series[i].Data[j] > mm[index][1])
                            mm[index][1] = series[i].Data[j];
                    }
                }
            }
            mm[0] = [min, max];
            sc.MinMax = mm;
            for (let i = 0; i < mm.length; i++){
                let order = mm[i][1].toString().length;
                let step;
                if (i===0 && !isAutoStep){
                    step = ctx.Options.AxisY.Scale[2];
                }
                else{
                    step = mm[i][2]? mm[i][2] : ( (mm[i][1]-mm[i][0] )*40 /height / (Math.pow(10, order-1))/5 ).toFixed(1) * Math.pow(10, order-1)*5;
                }
                let s = mm[i][0];
                let scale = [];
                if (order < 3 || true){
                    //debugger;
                    while (s <= mm[i][1]){
                        scale.push(s);
                        s += step;
                    }
                    scale.push(s);
                    sc.Scales.push(scale);
                }
            }
            return sc;
        }

        static GetAbscissa(labels, width){
            const stepX = width / (labels.length);
            return labels.map(function(a,i){return i*stepX});
        }
        static GetOrdinata(serie, scale, mm, height){
            let min = mm[0];
            let max = mm[1];
            const scaleCoefficient = scale[scale.length-1] / max;
            let ordinata = [];
            for (let j= 0; j < serie.length; j++){
                ordinata.push( height - (  (serie[j] - min) * height/(max-min)/scaleCoefficient )  );
            }
            //console.log('Y', Y);
            //console.log('ordinate', ordinate);
            //console.log(`min=${min} max=${max}`, height);
            //ordinata.push(ordinate);
            //console.log('ordinata', ordinata);
            return ordinata;



        }
        static GetPoints(X,Y){
            let points = [];
            //let length = X.length >= Y.length ? X.length:Y.length;
            for (let i = 0; i < Y.length; i++){
                points.push([X[i], Y[i]]);
            }
            return points;
        }
        static GetPath(points, type, line, color, width){
            switch (type){
                case 'line':
                    return Lure.Chart.GetPathLine(points, line, color, width);
                case 'bar':
                    return Lure.Chart.GetPathBar(points, line, color, width);
                case 'pie':
                    return '';
            }
        }
        static GetPathLine(points, line, color, width, isDots=true){
            const n = points.length;

            let xs = [];        //x
            let ys = [];        //y
            let dys = [];       //dx
            let dxs = [];       //dy
            let ds = [];        //derivative
            let ms = [];        //desired slope (m) at each point using Fritsch-Carlson method
            for(let i = 0; i < n; i++) {
                xs[i] = points[i][0];
                ys[i] = points[i][1];
            }
            // Calculate deltas and derivative
            for(let i = 0; i < n - 1; i++) {
                dys[i] = ys[i + 1] - ys[i];
                dxs[i] = xs[i + 1] - xs[i];
                ds[i] = dys[i] / dxs[i];
            }
            // Determine desired slope (m) at each point using Fritsch-Carlson method
            // See: http://math.stackexchange.com/questions/45218/implementation-of-monotone-cubic-interpolation
            ms[0] = ds[0];
            ms[n - 1] = ds[n - 2];
            for(let i = 1; i < n - 1; i++) {
                if(ds[i] === 0 || ds[i - 1] === 0 || (ds[i - 1] > 0) !== (ds[i] > 0)) {
                    ms[i] = 0;
                } else {
                    ms[i] = 3 * (dxs[i - 1] + dxs[i]) / (
                        (2 * dxs[i] + dxs[i - 1]) / ds[i - 1] +
                        (dxs[i] + 2 * dxs[i - 1]) / ds[i]);
                    if(!isFinite(ms[i])) {
                        ms[i] = 0;
                    }
                }
            }
            let d = `M ${xs[0]},${ys[0]}`;
            let dots = '<g class="mt-chart-dots">';
            for(let i = 0; i < n - 1; i++) {
                //console.log(d);
                d += ` C ${xs[i] + dxs[i] / 3},${ys[i] + ms[i] * dxs[i] / 3} ${xs[i + 1] - dxs[i] / 3},${ys[i + 1] - ms[i + 1] * dxs[i] / 3} ${xs[i + 1]},${ys[i + 1]}`;
                if (isDots)
                    dots += Lure.Chart.GetPathLineDot(xs[i] , ys[i], line, i, color, width );
            }
            dots += '</g>';
            //return d;
            //console.log(d);
            return `<g class="mt-chart-serie"><path data-line="${line}" d="${d}" fill="none" stroke="${color}" stroke-width="${width}"></path> ${dots}</g>`;
        }
        static GetPathLineDot(x,y, i,j, color, width){
            return `<circle class="mt-chart-point" data-line="${i}" data-item="${j}" cx="${x}" cy="${y}" r="${width}" stroke="${color}" stroke-width="2" fill="#fff" ></circle>`

        }
        static GetPathBar(points, line, color, width){
            const wd = 30;
            console.log('GetPathBar', points);
            // return '';
            let p = `<path data-line="${line}" d=${0} fill="${color}" stroke="${color}" stroke-width="${width}"></path>`;
            // let d = `M ${points[0][0]}  ${points[0][1]}`;
            let dots = '';
            for (let i = 0; i < points.length; i++){
                let d =`M ${points[i][0]} ${points[i][1]} L ${points[i][0]} ${points[i][1]}`;
                dots += Lure.Chart.GetPathLineDot(points[i][0] , points[i][1], line, i, color, width );
            }
            // debugger;
            return dots;
        }


        /*builder*/
        static MakeLegend(Serie, i){
            return `<div class="mt-chart-legend__item row">
                          <input class="mt-legend-checkbox" type="checkbox" checked="checked" id="legcheck${Serie.Name}${i}">
                          <div class="mt-legend-icon" style="background-color: ${Serie.Color}"></div>
                          <label class="mt-legend-label" for="legcheck${Serie.Name}${i}">${Serie.Name}</label>
                        </div>`;
        }

        static GetGrid(sizeX, sizeY){
            let grid = ``;
            for (let i = 0; i < sizeY; i++){
                grid += `<div class="mt-chart__grid-line row flex-100 flex-between">`;
                for (let j = 0; j < sizeX; j++) {
                    grid += `<div class='mt-chart__grid-item flex-100'></div>`;
                }
                grid += `</div>`;
            }
            grid += ``;
            return grid;
        }
    }
};

Lure.Chart = Lure.Plugin.Chart.Chart;


Lure.__GenegateString = function () {
    let gen = Math.random().toString(36).replace("0.", '').replace(/[\d]+/, '').substring(0,1);
    if (Lure.Select(`#${gen}`)){
        gen = Lure.__GenegateString();
    }
    return gen;
};





















