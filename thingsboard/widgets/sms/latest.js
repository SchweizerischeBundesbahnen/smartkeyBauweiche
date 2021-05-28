self.onInit = function() {
      let updateData = function() {
            data = data.downlink_messages;
            if (data.length) {
                  let container = document.createElement('div');
                  container.className = 'tbDatasource-container';

                  self.ctx.$container.empty();
                  self.ctx.$container.append(container);

                  let title = document.createElement('div');
                  title.innerHtml = 'Letzte Downlinks';
                  container.appendChild(title);
                  console.log(data);

                  // self.ctx.datasourceTitleCells.push(title);

                  let table = document.createElement('table');
                  table.className = 'tbDatasource-table';
                  let colgroup = document.createElement('colgroup');
                  let col1 = document.createElement('col');
                  col1.width = '30%';
                  let col2 = document.createElement('col');
                  col2.width = '20%';
                  let col3 = document.createElement('col');
                  col3.width = '500%';
                  colgroup.appendChild(col1);
                  colgroup.appendChild(col2);
                  colgroup.appendChild(col3);
                  table.appendChild(colgroup);
                  container.appendChild(table);

                  for (var a = 0; a < data.length; a++) {
                        console.log(data[a]);
                        let tr = document.createElement('tr');
                        let td1 = document.createElement('td');
                        td1.innerHTML = data[a].timestamp;
                        tr.appendChild(td1);
                        let td2 = document.createElement('td');
                        td2.innerHTML = data[a].port;
                        tr.appendChild(td2);
                        let td3 = document.createElement('td');
                        td3.innerHTML = data[a].payload;
                        tr.appendChild(td3);
                        table.appendChild(tr);
                  }
            }
      };
};

self.onDataUpdated = function() {
      console.log('Data from SMS:');
      console.log(self.ctx.data);
      console.log(self.ctx.data[1].data[0]);
      console.log(self.ctx);
};

// self.onResize = function() {
//       var datasourceTitleFontSize = self.ctx.height / 8;
//       if (self.ctx.width / self.ctx.height <= 1.5) {
//             datasourceTitleFontSize = self.ctx.width / 12;
//       }
//       datasourceTitleFontSize = Math.min(datasourceTitleFontSize, 20);
//       for (var i = 0; i < self.ctx.datasourceTitleCells.length; i++) {
//             $(self.ctx.datasourceTitleCells[i]).css('font-size', datasourceTitleFontSize + 'px');
//       }
//       var valueFontSize = self.ctx.height / 9;
//       var labelFontSize = self.ctx.height / 9;
//       if (self.ctx.width / self.ctx.height <= 1.5) {
//             valueFontSize = self.ctx.width / 15;
//             labelFontSize = self.ctx.width / 15;
//       }
//       valueFontSize = Math.min(valueFontSize, 18);
//       labelFontSize = Math.min(labelFontSize, 18);

//       for (i = 0; i < self.ctx.valueCells; i++) {
//             self.ctx.valueCells[i].css('font-size', valueFontSize + 'px');
//             self.ctx.valueCells[i].css('height', valueFontSize * 2.5 + 'px');
//             self.ctx.valueCells[i].css('padding', '0px ' + valueFontSize + 'px');
//             self.ctx.labelCells[i].css('font-size', labelFontSize + 'px');
//             self.ctx.labelCells[i].css('height', labelFontSize * 2.5 + 'px');
//             self.ctx.labelCells[i].css('padding', '0px ' + labelFontSize + 'px');
//       }
// }

self.onDestroy = function() {};



// self.onInit = function() {

//     self.ctx.datasourceTitleCells = [];
//     self.ctx.valueCells = [];
//     self.ctx.labelCells = [];

//     for (var i = 0; i < self.ctx.datasources.length; i++) {
//         var tbDatasource = self.ctx.datasources[i];

//         var datasourceId = 'tbDatasource' + i;
//         self.ctx.$container.append("<div id='" + datasourceId + "' class='tbDatasource-container'></div>");

//         var datasourceContainer = $('#' + datasourceId, self.ctx.$container);

//         datasourceContainer.append("<div class='tbDatasource-title'>" + tbDatasource.name + "</div>");

//         var datasourceTitleCell = $('.tbDatasource-title', datasourceContainer);
//         self.ctx.datasourceTitleCells.push(datasourceTitleCell);

//         var tableId = 'table' + i;
//         datasourceContainer.append("<table id='" + tableId + "' class='tbDatasource-table'><col width='30%'><col width='70%'></table>"
//         );
//         var table = $('#' + tableId, self.ctx.$container);

//         for (var a = 0; a < tbDatasource.dataKeys
//             .length; a++) {
//             var dataKey = tbDatasource.dataKeys[a];
//             var labelCellId = 'labelCell' + a;
//             var cellId = 'cell' + a;
//             table.append("<tr><td id='" + labelCellId +
//                 "'>" + dataKey.label +
//                 "</td><td id='" + cellId +
//                 "'></td></tr>");
//             var labelCell = $('#' + labelCellId, table);
//             self.ctx.labelCells.push(labelCell);
//             var valueCell = $('#' + cellId, table);
//             self.ctx.valueCells.push(valueCell);
//         }
//     }

//     self.onResize();
// }

// self.onDataUpdated = function() {
//     for (var i = 0; i < self.ctx.valueCells
//         .length; i++) {
//         var cellData = self.ctx.data[i];
//         if (cellData && cellData.data && cellData.data
//             .length > 0) {
//             var tvPair = cellData.data[cellData.data
//                 .length -
//                 1];
//             var value = tvPair[1];
//             var textValue;
//             //toDo -> + IsNumber

//             if (isNumber(value)) {
//                 var decimals = self.ctx.decimals;
//                 var units = self.ctx.units;
//                 if (cellData.dataKey.decimals ||
//                     cellData.dataKey.decimals === 0) {
//                     decimals = cellData.dataKey
//                     .decimals;
//                 }
//                 if (cellData.dataKey.units) {
//                     units = cellData.dataKey.units;
//                 }
//                 txtValue = self.ctx.utils.formatValue(
//                     value, decimals, units, true);
//             } else {
//                 txtValue = value;
//             }
//             self.ctx.valueCells[i].html(txtValue);
//         }
//     }

//     function isNumber(n) {
//         return !isNaN(parseFloat(n)) && isFinite(n);
//     }
// }

// self.onResize = function() {
//     var datasourceTitleFontSize = self.ctx.height / 8;
//     if (self.ctx.width / self.ctx.height <= 1.5) {
//         datasourceTitleFontSize = self.ctx.width / 12;
//     }
//     datasourceTitleFontSize = Math.min(
//         datasourceTitleFontSize, 20);
//     for (var i = 0; i < self.ctx.datasourceTitleCells
//         .length; i++) {
//         self.ctx.datasourceTitleCells[i].css(
//             'font-size', datasourceTitleFontSize +
//             'px');
//     }
//     var valueFontSize = self.ctx.height / 9;
//     var labelFontSize = self.ctx.height / 9;
//     if (self.ctx.width / self.ctx.height <= 1.5) {
//         valueFontSize = self.ctx.width / 15;
//         labelFontSize = self.ctx.width / 15;
//     }
//     valueFontSize = Math.min(valueFontSize, 18);
//     labelFontSize = Math.min(labelFontSize, 18);

//     for (i = 0; i < self.ctx.valueCells; i++) {
//         self.ctx.valueCells[i].css('font-size',
//             valueFontSize + 'px');
//         self.ctx.valueCells[i].css('height',
//             valueFontSize * 2.5 + 'px');
//         self.ctx.valueCells[i].css('padding', '0px ' +
//             valueFontSize + 'px');
//         self.ctx.labelCells[i].css('font-size',
//             labelFontSize + 'px');
//         self.ctx.labelCells[i].css('height',
//             labelFontSize * 2.5 + 'px');
//         self.ctx.labelCells[i].css('padding', '0px ' +
//             labelFontSize + 'px');
//     }
// }

// self.onDestroy = function() {}
