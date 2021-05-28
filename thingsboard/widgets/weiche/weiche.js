self.onInit = function() {
      var scope = self.ctx.$scope;
      var id = self.ctx.$scope.$injector.get('utils').guid();
      scope.tableId = "table-" + id;
      scope.ctx = self.ctx;
};

self.onDataUpdated = function() {
      self.ctx.$scope.$broadcast('timeseries-table-data-updated', self.ctx.$scope.tableId);
      // console.log('Bauweiche XY Widget onDataUpdated()');
      // console.log(self.ctx.$scope);
      self.ctx.$scope.$root.$emit('bwm', {
            weichenstatus: self.ctx.data
      });
};

self.actionSources = function() {
      return {
            'actionCellButton': {
                  name: 'widget-action.action-cell-button',
                  multiple: true
            },
            'rowClick': {
                  name: 'widget-action.row-click',
                  multiple: false
            }
      };
};

self.onDestroy = function() {};
