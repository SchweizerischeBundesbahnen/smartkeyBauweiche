/**
 * TODO
 *
 * BUG: Text zentrierbar machen
 *
 *
 *
 */


/*global $*/
var scope, speed, increment, flag;


const xmlns = "http://www.w3.org/2000/svg";

const svg_cloud_link = 'https://dl.dropboxusercontent.com/s/5cy5jz4v53ptlgf/iltis.svg?dl=1';

// Status von Iltis
var iltis = {
      linien: []
};

const lineBottom = 318;
const lineTop = 260;

const linien = [{
            name: 1,
            x: 375,
            y: lineBottom
      },
      {
            name: 11,
            x: 180,
            y: lineBottom
      },
      {
            name: 101,
            x: 90,
            y: lineBottom
      },
      {
            name: 61,
            x: 610,
            y: lineBottom
      },
      {
            name: 102,
            x: 700,
            y: lineBottom
      },
      {
            name: 21,
            x: 180,
            y: lineTop
      },
      {
            name: 2,
            x: 375,
            y: lineTop
      }
];

var currentSelectedLinie = null;


const COLOR_SPERRE = '#f5fc07';

const svgLayerSperrtext = document.getElementById('layer3');

let svgWidth, svgHeight;


const BUTTON_WIDTH = 90;
const BUTTON_HEIGHT = 23;


let rect = function(x, y, width, height, fill = '#fff', stroke = '#a6a6a6', strokeWidth = 0.9, strokeDasharray = 'none') {
      let r = document.createElementNS(xmlns, 'rect');
      r.setAttributeNS(null, 'x', x);
      r.setAttributeNS(null, 'y', y);
      r.setAttributeNS(null, 'width', width);
      r.setAttributeNS(null, 'height', height);
      r.setAttributeNS(null, 'fill', fill);
      r.setAttributeNS(null, 'stroke', stroke);
      r.setAttributeNS(null, 'stroke-width', strokeWidth);
      r.setAttributeNS(null, 'stroke-dasharray', strokeDasharray);
      return r;
};
let textField = function(x, y, content, fontSize = '10px', strokeWidth = 0.9, fontweight = 'normal') {
      let r = document.createElementNS(xmlns, 'text');
      r.setAttributeNS(null, 'x', x);
      r.setAttributeNS(null, 'y', y);
      r.setAttributeNS(null, 'font-size', fontSize);
      r.setAttributeNS(null, 'font-family', 'Arial');
      r.setAttributeNS(null, 'stroke-width', strokeWidth);
      r.setAttributeNS(null, 'fill', '#000');
      r.setAttributeNS(null, 'font-weight', fontweight);
      r.textContent = content;
      return r;
};

let Btn = function(title, x, y) {
      const BTN_WIDTH = 90;
      const BTN_HEIGHT = 23;
      let g0 = document.createElementNS(xmlns, 'g'); // Group which holds button
      let border = rect(x, y, BTN_WIDTH, BTN_HEIGHT, '#f0f0f0', '#696969'); // Border of button
      let path = document.createElementNS(xmlns, 'path'); // shadow
      path.setAttributeNS(null, 'd', 'M' + x + ' ' + (y - 1) + 'v25 l 1 -1 v -' + BUTTON_HEIGHT + ' h ' + (BUTTON_WIDTH - 1) + ' l 1 -1 z'); // shadow with 1px shift left-top
      path.setAttributeNS(null, 'fill', '#000');
      let text = textField(x, y + 15, title, 10, 0.8); // Button text
      g0.appendChild(border);
      g0.appendChild(path);
      g0.appendChild(text);
      this.onclick = function(fn) {
            $(g0).children().click(fn);
      };
      this.dom = g0;
      text.setAttributeNS(null, 'x', x + (BTN_WIDTH - title.length * 4.5) / 2);
};




/**
 * Run once when widget is loaded
 *
 *
 */

self.onInit = function() {

      // handle for receiving data from BWM
      self.ctx.$scope.$root.$on('bwm-iltis', function(evt, data) {
            console.log('Iltis: New Data from BWM: Sperrtext:');
            data;
            console.log(iltis);
      });


      let httpGet = function(theUrl, auth) {
            auth = auth || false;
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open("GET", theUrl, false); // false for synchronous request
            if (auth) {
                  xmlHttp.setRequestHeader("Authorization", "Basic " + btoa(auth));
            }
            xmlHttp.send(null);
            return xmlHttp.responseText;
      };
      let svg = httpGet(svg_cloud_link);
      let wrapper = document.getElementById('svg-wrapper');
      wrapper.innerHTML = svg;
      svg = document.getElementById('svg-wrapper').firstElementChild;
      let svgViewBox = document.getElementById('svg-wrapper').firstElementChild.attributes.getNamedItem('viewBox').value.split(' ');
      svgWidth = document.getElementById('svg-wrapper').firstElementChild.attributes.getNamedItem('width').value;
      svgHeight = document.getElementById('svg-wrapper').firstElementChild.attributes.getNamedItem('height').value;
      let windowBackground = document.getElementById('wndBackgroundBlack');

      let iltisBtn = {
            cmSPEGBtnAbbrechen: $('#cmSPEGBtnAbbrechen')
      };
      let cmSpeg = document.getElementById('cmSPEG');

      let itemSpeg = $('#cmItemSpeg');

      for (let i = 0; i < linien.length; i++) {
            let l = new Linie(linien[i].name, { x: linien[i].x, y: linien[i].y });
            l.append(windowBackground);
            iltis.linien.push(l);
      }

      document.getElementById("iconClose").onclick = function() { alert("Fenster kann nicht geschlossen werden"); };
      document.getElementById("mntxtBild").onclick = function() { alert("Keine Funktion für '" + $(this).find('#mntxtBild').find('tspan').text() + "' hinterlegt"); };
      document.getElementById("mntxtOptionen").onclick = function() { alert("Keine Funktion für '" + $(this).find('#mntxtOptionen').find('tspan').text() + "' hinterlegt"); };
      document.getElementById("mntxtTexte").onclick = function() { alert("Keine Funktion für '" + $(this).find('#mntxtTexteText').find('tspan').text() + "' hinterlegt"); };
      let mnContext = document.getElementById('mnContext');
      let mnContextTitle = document.getElementById('cmTitle');
      let mnDateTime = document.getElementById('mnDateTime');
      let cmTitleNr = document.getElementById('cmTitleNr');
      $(mnContext).hide();
      $(cmSpeg).hide();
      let mnContextUpperLeft = document.getElementById('mnContextUpperLeft');

      // Kontextmenu vom Browser deaktivieren
      $(document).bind('contextmenu', e => { e.preventDefault(); return false; });


      // Alle Sperren ausblenden
      // $("[id^=sperre]").hide();

      // bei Click ins schwarze, contextMenu ausblenden
      windowBackground.onclick = function() {
            $(mnContext).hide();
      };


      // Sperrtext-Fenster öffnen bei Click auf "SPEG"
      itemSpeg.children().click(function(ev) {
            currentSelectedLinie.sperrtexte.loadWindow();
      });


      // Context-Menu hintegrund unter Maus blau färben on hover
      // ToDo: also on text-hover
      $('.cmMenuItemBg').parent().children().hover(function() {
            if (this.nodeName === 'rect') {
                  $(this).css('fill', '#0a2467');
                  $(this).siblings().first().css('fill', '#fff'); // text
            }
            else {
                  $(this).css('fill', '#fff');
                  $(this).siblings().first().css('fill', '#0a2467'); // text
            }
      }, function() {
            if (this.nodeName === 'rect') {
                  $(this).css('fill', '#f8f7f5');
                  $(this).siblings().first().css('fill', '#000'); // text
            }
            else {
                  $(this).css('fill', '#000');
                  $(this).siblings().first().css('fill', '#f8f7f5'); // text
            }
      });


      // Zeit oben anzeigen
      setInterval(function() {
            mnDateTime.textContent = getDateTimeLeadingZeros().join('       ');
      }, 1000);

      document.onmousemove = function(event) {

      };



};





var centerCoordinates = function(mainLength, pos, objectLength) {
      return ((mainLength / 2 - pos - objectLength / 2));
};


var translateSvgGroupToMousePos = function(x, y, groupObject, svgDom) {
      let mnContextXY = groupObject.getBBox();
      let pt = svgDom.createSVGPoint();
      pt.x = x;
      pt.y = y;
      let svgP = pt.matrixTransform(svgDom.getScreenCTM().inverse());
      let tXY = [svgP.x - mnContextXY.x, svgP.y - mnContextXY.y];
      groupObject.setAttribute('transform', 'translate(' + tXY[0] + ',' + tXY[1] + ')');
};


var getDateTimeLeadingZeros = function(d) {
      if (d === undefined) d = new Date();
      let l = v => ('0' + v).slice(-2);
      return [l(d.getDate()) + '.' + l(d.getMonth() + 1) + '.' + l(d.getFullYear()), l(d.getHours()) + ':' + l(d.getMinutes()) + ':' + l(d.getSeconds())];
};



/**
 * Object "Linie", Streckenlinie
 *
 *
 */
var Linie = function(num, pos) {
      var self = this;

      this.num = num;
      this.create(pos.x, pos.y);
      this.sperrtexte = new Sperrtexte(this.num);
      this.gesperrt = false;


      // Strecke Rechtsclick event; Context-Menu ausfüllen nach ausgewählter Strecke
      $(this.clickAreaDom).add(this.bars).add(this.dotOben).add(this.dotUnten).bind('contextmenu', function(ev) {
            let mnContext = document.getElementById('mnContext');
            let event = ev || window.event; // IE-ism
            event.preventDefault();
            currentSelectedLinie = self;
            $('#cmTitleNr, #cmSPEGGleisnummerTitle, #cmSPEGGleisnummer').text(num);
            translateSvgGroupToMousePos(event.clientX, event.clientY, mnContext, document.getElementById('svg-wrapper').firstElementChild);
            // TODO: if contextMenu ist outside Window, move inside
            $(mnContext).show();
            return false;
      });


      $(this.domNumBg).hide();
      $(this.bars).hide();

};

Linie.prototype.create = function(x, y) {
      const wBars = 2.6;
      const hBars = 20;
      const sizeDots = 4;
      let g = document.createElementNS(xmlns, 'g');
      g.setAttributeNS(null, 'id', 'fsperre-' + this.num);
      let path = document.createElementNS(xmlns, 'path');
      path.setAttributeNS(null, 'd', 'm ' + x + ',' + y + ' h ' + wBars + ' v ' + hBars + ' h -' + wBars + ' z m -' + (wBars + sizeDots) + ',0 h ' + wBars + ' v ' + hBars + ' h -' + wBars + ' z');
      path.setAttributeNS(null, 'style', 'display:inline;fill:' + COLOR_SPERRE + ';fill-opacity:1;stroke:none');
      this.bars = path;
      let rect = document.createElementNS(xmlns, 'rect');
      rect.setAttributeNS(null, 'x', x - 20);
      rect.setAttributeNS(null, 'y', y - 25);
      rect.setAttributeNS(null, 'width', 35);
      rect.setAttributeNS(null, 'height', 18);
      rect.setAttributeNS(null, 'style', 'display:inline;fill:' + COLOR_SPERRE + ';stroke:none');
      this.domNumBg = rect;
      let text = document.createElementNS(xmlns, 'text');
      let len = this.num.toString().length;
      text.setAttributeNS(null, 'x', x - 6 * len);
      text.setAttributeNS(null, 'y', y - 25 + 15);
      text.setAttributeNS(null, 'style', 'font-size:20px;font-family:Arial;display:inline;fill:#fefefe;stroke:none;');
      text.textContent = this.num;
      this.domText = text;
      let rectsmall1 = document.createElementNS(xmlns, 'rect');
      rectsmall1.setAttributeNS(null, 'x', x - 4);
      rectsmall1.setAttributeNS(null, 'y', y - 0);
      rectsmall1.setAttributeNS(null, 'width', sizeDots);
      rectsmall1.setAttributeNS(null, 'height', sizeDots);
      rectsmall1.setAttributeNS(null, 'style', 'display:inline;fill:#ffffff;stroke:none');
      this.dotOben = rectsmall1;
      let rectsmall2 = document.createElementNS(xmlns, 'rect');
      rectsmall2.setAttributeNS(null, 'x', x - 4);
      rectsmall2.setAttributeNS(null, 'y', y + 16);
      rectsmall2.setAttributeNS(null, 'width', sizeDots);
      rectsmall2.setAttributeNS(null, 'height', sizeDots);
      rectsmall2.setAttributeNS(null, 'style', 'display:inline;fill:#ffffff;stroke:none');
      this.dotUnten = rectsmall2;
      let rectClickArea = document.createElementNS(xmlns, 'rect');
      rectClickArea.setAttributeNS(null, 'x', x - 2 - wBars - 8);
      rectClickArea.setAttributeNS(null, 'y', y - 4);
      rectClickArea.setAttributeNS(null, 'width', wBars * 2 + sizeDots + 16);
      rectClickArea.setAttributeNS(null, 'height', hBars + 8);
      rectClickArea.setAttributeNS(null, 'style', 'display:inline;fill:#000000;stroke:none');
      this.clickAreaDom = rectClickArea;
      g.appendChild(rectClickArea);
      g.appendChild(rectsmall1);
      g.appendChild(rectsmall2);
      g.appendChild(path);
      g.appendChild(rect);
      g.appendChild(text);
      this.dom = g;
};

Linie.prototype.append = function(parentDom) {
      // parentDom.appendChild(this.dom);
      $(this.dom).insertAfter($(parentDom));
};


Linie.prototype.sperren = function(sperren) {
      this.gesperrt = sperren;
      if (sperren) {
            this.domText.setAttributeNS(null, 'style', 'font-size:20px;font-family:Arial;display:inline;fill:#000000;stroke:none;');
            $(this.bars).show();
            $(this.domNumBg).show();
      }
      else {
            this.domText.setAttributeNS(null, 'style', 'font-size:20px;font-family:Arial;display:inline;fill:#fefefe;stroke:none;');
            $(this.bars).hide();
            $(this.domNumBg).hide();
      }
};

Linie.prototype.addSperrtext = function(text) {
      if (this.sperrtexte.indexOf(text) === -1) {
            this.sperrtexte.push(text);
      }
      this.sperren(true);
};

Linie.prototype.getSperrtexte = function() {
      return this.sperrtexte.items;
};



/**
 * ****************************************************************************************************
 * Class Sperrtexte
 *
 * Window which shows sperrtexte and active sperrtexte
 *
 * ****************************************************************************************************
 */
var Sperrtexte = function(linie) {
      this.linie = linie;
      this.items = [];
      this.itemsDom = [];
      this.selected = -1; // currently selected element of array (0..n); -1 = nothing selected
      this.LINE_HEIGHT = 13; // DOM Height of List Item
      this.LEFT = 484; // Initial left of window
      this.TOP = 363; // Initial top of window

};


Sperrtexte.prototype.loadWindow = function() {
      // Load window
      this.window();
      // Center window
      let groupObject = this.dom;
      let mnContextXY = groupObject.getBBox();
      let translateX = centerCoordinates(svgWidth, mnContextXY.x, mnContextXY.width);
      let translateY = centerCoordinates(svgHeight, mnContextXY.y, mnContextXY.height);
      this.dom.setAttribute('transform', 'translate(' + translateX + ',' + translateY + ')');

      // empty items dom
      this.itemsDom = [];

      // Load (selected) Sperrtexte
      this.reloadSelected();
};

// Reload list of active Sperrtexte
Sperrtexte.prototype.reloadSelected = function() {
      // Remove old Elements
      $(this.listSelected).empty();

      let xy = this.listSelectedBorder.getBBox();
      for (let i = 0; i < this.items.length; i++) {
            let x = xy.x + 3;
            let y = xy.y + this.LINE_HEIGHT + (i * this.LINE_HEIGHT) - 3;
            let domIndex = this.createSingleElementDom(this.items[i], x, y);
            if (i === this.selected) {
                  $(this.bluebarSelected).show();
                  this.bluebarSelected.setAttributeNS(null, 'x', xy.x + 4);
                  this.bluebarSelected.setAttributeNS(null, 'y', xy.y);
            }
            $(this.listSelected).append($(this.itemsDom[domIndex].dom));
      }
};

Sperrtexte.prototype.createSingleElementDom = function(content, x, y) {
      let self = this;
      let text = document.createElementNS(xmlns, 'text');
      text.setAttributeNS(null, 'x', x);
      text.setAttributeNS(null, 'y', y);
      text.setAttributeNS(null, 'style', 'font-size:10px;font-family:Arial;display:inline;fill:#000;stroke:none;');
      text.textContent = content;
      let index = this.itemsDom.push({ dom: text, y: y }) - 1;
      $(text).click(() => {
            self.selected = index;
            self.bluebarSelected.setAttributeNS(null, 'y', y - self.LINE_HEIGHT);
            $(self.bluebarSelected).show();
      });
      return index;
};


Sperrtexte.prototype.removeEntry = function(id) {
      currentSelectedLinie.sperrtexte.items.splice(id, 1);
      if (!this.items.length) $(this.bluebarSelected).hide();
};


Sperrtexte.prototype.window = function() {
      let myself = this;
      const WINDOW_HEIGTH = 370;
      const WINDOW_WIDTH = 220;
      const LEFT = this.LEFT + 10;
      $(svgLayerSperrtext).empty(); // altes Fenster löschen

      let g0 = document.createElementNS(xmlns, 'g');
      let list0 = rect(LEFT, this.TOP + 75, 200, 110);
      let list1 = rect(LEFT, this.TOP + 220, 200, 70);
      this.listSelectedBorder = list1;
      let border = document.createElementNS(xmlns, 'path');
      border.setAttributeNS(null, 'd', 'm ' + this.LEFT + ' ' + this.TOP + ' v ' + WINDOW_HEIGTH + ' h ' + WINDOW_WIDTH + ' v -' + WINDOW_HEIGTH + ' z m 10 75 h 200 v 110 h -200 z');
      border.setAttributeNS(null, 'fill', '#f0f0f0');
      border.setAttributeNS(null, 'stroke', '#b3b3b3');
      border.setAttributeNS(null, 'stroke-width', '0.9');
      let g1 = document.createElementNS(xmlns, 'g');


      let btnOK = new Btn('OK', LEFT, 665);
      let btnEntfernen = new Btn('Entfernen', LEFT + BUTTON_WIDTH + 16, 665);
      let btnAbbrechen = new Btn('Abbrechen', LEFT, 665 + 26);
      let btnHilfe = new Btn('Hilfe', LEFT + BUTTON_WIDTH + 16, 665 + 26, false);


      // Text Fields
      let titles = [
            { text: 'Sperre Gleis %s  : Sperrtexte', size: '10px', x: LEFT, y: this.TOP + 17, weight: 'normal', strokeWidth: 0.1 },
            { text: 'SPEG  ... %s', size: '15px', x: LEFT, y: this.TOP + 50, weight: 'bold', strokeWidth: 0.3 },
            { text: 'Definierte Sperrtexte:', size: '10px', x: LEFT, y: this.TOP + 70, weight: 'normal', strokeWidth: 0.1 },
            { text: 'Nr. Zugeordnete Sperrtexte', size: '10px', x: LEFT, y: this.TOP + 210, weight: 'normal', strokeWidth: 0.1 }
      ];


      // Button Functions
      btnOK.onclick(function() {
            let index = -1;
            for (let i in iltis.linien) {
                  if (iltis.linien[i].num === myself.linie) index = i;
            }
            if (index >= 0 && myself.items.length) {
                  iltis.linien[index].sperren(true);
            }
            else if (index >= 0) {
                  iltis.linien[index].sperren(false);
            }
            $(myself.dom).remove();
            $(document.getElementById('mnContext')).hide();
            self.ctx.$scope.$root.$emit('iltis-bwm', {
                  status: iltis
            });
      });
      btnAbbrechen.onclick(function() {
            $(myself.dom).remove();
      });
      btnEntfernen.onclick(() => {
            myself.removeEntry(myself.selected);
            myself.reloadSelected();
      });

      // List Groups
      let g2 = document.createElementNS(xmlns, 'g');
      this.listOptions = g2;
      let g3 = document.createElementNS(xmlns, 'g');
      this.listSelected = g3;

      // Selecttion bar blue
      let bluebar0 = rect(LEFT, 450, 180, this.LINE_HEIGHT, '#0078d7', '#fd872b', 0.9, '0.9, 0.9');
      $(bluebar0).hide();
      this.bluebarSelected = bluebar0;
      let bluebar1 = rect(LEFT, 450, 200, this.LINE_HEIGHT, '#0078d7', '#fd872b', 0.9, '0.9, 0.9');
      $(bluebar1).hide();
      this.bluebarSelection = bluebar1;

      // Populate list
      const items = [
            '10: Weiche gesperrt',
            '11: Gleis gesperrt',
            '12: FL ausgeschaltet',
            '13: FL geerdet',
            '14: Zug auf Strecke',
            '15: Rangierbewegung',
            '16: Begenungsverbot',
            '17: Einspurbetrieb'
      ];
      for (let i in items) {
            let x = LEFT + 3;
            let y = this.TOP + 75 + this.LINE_HEIGHT + (i * this.LINE_HEIGHT) - 1;
            let text = textField(x, y, items[i]);
            let r = rect(x - 2, y - this.LINE_HEIGHT, 180, this.LINE_HEIGHT, '#fff', 'none');
            $(text).add(r).click(() => {
                  $(myself.bluebarSelection).show();
                  myself.bluebarSelection.setAttributeNS(null, 'y', y - myself.LINE_HEIGHT + 3);
            });
            $(text).add(r).dblclick(() => {
                  myself.items.push(items[i]);
                  myself.reloadSelected();
            });
            // $(g2).append($(r));
            $(g2).append($(text));
      }

      g0.appendChild(border); // border of Window
      for (let i in titles) {
            g0.appendChild(textField(titles[i].x, titles[i].y, titles[i].text.replace('%s', this.linie), titles[i].size, titles[i].strokeWidth, titles[i].weight));
      }
      g0.appendChild(list0); // border of seltectable items
      g0.appendChild(list1); // LIst with selcted Items
      g0.appendChild(bluebar0); // selection bar
      g0.appendChild(bluebar1); // selection bar
      g0.appendChild(g1); // Group of buttons
      g0.appendChild(g2); // Group of selectable items
      g0.appendChild(g3); // group for selected items

      g1.appendChild(btnOK.dom);
      g1.appendChild(btnEntfernen.dom);
      g1.appendChild(btnAbbrechen.dom);
      g1.appendChild(btnHilfe.dom);
      this.dom = g0;
      document.getElementById('layer3').appendChild(g0);

};



// <tspan id="tspan683" x="861.53748" y="353.41629" font-family="Arial" font-size="15.132px" font-weight="bold" stroke-width=".3783px" style="font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal">SPEG ...</tspan>





self.onDataUpdated = function() {

};

self.typeParameters = function() {
      return {
            maxDatasources: 1,
            maxDataKeys: 1
      };
};

self.onDestroy = function() {
      window.globalFlag = false;
};


self.onResize = function() {


};
