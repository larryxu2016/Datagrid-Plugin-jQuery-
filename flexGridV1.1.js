(function(window, $, undefined) {

    var getOrApply = function(value, context) {
        if($.isFunction(value)) {
            return value.apply(context, $.makeArray(arguments).slice(2));
        }
        return value;
    };

    var normalizePromise = function(promise) {
        var d = $.Deferred();

        if(promise && promise.then) {
            promise.then(function() {
                d.resolve.apply(d, arguments);
            }, function() {
                d.reject.apply(d, arguments);
            });
        } else {
            d.resolve(promise);
        }

        return d.promise();
    };

    var defaultDataOps = {
        loadData: $.noop,
        insertItem: $.noop,
        updateItem: $.noop,
        deleteItem: $.noop
    };

    $.fn.flexGrid = function(config) {
        this.each(function(){
            var $element = $(this);
            new FlexGrid($element, config);
        });
    };

    function FlexGrid(element, config) {
        this._container = $(element);
        this.data = [];
        this.cols = [];
        this.subCols = [];
        this.fixedCols = [];
        this.subColsInFixedCols = [];
        this.hasSubCols = false;
        this.hasSubColsInFixedCols = false;
		
		this.colNum = 0;
		this.rowNum = 0;
        this.rowLength = [];
        
        this._initialize(config);
        this._renderTable();
        $(window).on("load", $.proxy(this._refreshSize, this));
        $(window).on("resize", $.proxy(this._refreshSize, this));
    }

    FlexGrid.prototype = {

        onDataLoaded: $.noop,
        onDataLoading: $.noop,

        /**
         * Initialize subparts.
         * @param config
         */
        _initialize: function(config) {
            $.extend(this, config);            
            this.initContainers();
            //this.initColumns();
            this.initDataOps();
            //this._refreshSize();
            
        },

        /**
         * Construct Div containers to organize tables.
         */
        initContainers: function() {
            this._container.addClass("container").addClass("clearfix");
            this.initLeftContainer();
            this.initRightContainer();
        },

        /**
         * Construct Div containers for left panel (frozen columns).
         */
        initLeftContainer: function() {
            //left
            this._leftContainer = $("<div>")
                .addClass("left-container")
                .appendTo(this._container);

            //top-left
            this._topLeftContainer = $("<div>")
                .addClass("top-left-container")
                .appendTo(this._leftContainer);

            //bottom-left
            this._outerBottomLeftContainer = $("<div>")
                .addClass("outer-bottom-left-container")
                .appendTo(this._leftContainer);
            this._bottomLeftContainer = $("<div>")
                .addClass("bottom-left-container")
                .addClass("table-scrollbar")
                .appendTo(this._outerBottomLeftContainer);
        },

        /**
         * Construct Div containers for right panel (data section).
         */
        initRightContainer: function() {
            //right
            this._rightContainer = $("<div>")
                .addClass("right-container")
                .appendTo(this._container);

            //top-right
            this._outerTopRightContainer = $("<div>")
                .addClass("outer-top-right-container")
                .appendTo(this._rightContainer);
            this._topRightContainer = $("<div>")
                .addClass("top-right-container")
                .addClass("table-scrollbar")
                .appendTo(this._outerTopRightContainer);

            //bottom-right
            this._bottomRightContainer = $("<div>")
                .addClass("bottom-right-container")
                .appendTo(this._rightContainer);
        },

        /**
         * Initialize the data types of each column if specified.
         */
        initColumns: function() {

        },

        /**
         * Extend the existing data operations.
         */
        initDataOps: function() {
            this._dataOps = $.extend({}, defaultDataOps, getOrApply(this.dataOps, this));
        },

        /**
         * Create required elements of the grid and bind the data.
         */
        _renderTable: function() {
            this.createHeader();
            this.createBody();
            this.loadData();
        },

        /**
         * Create column headings, including the ones in the frozen panel.
         */
        createHeader: function() {
            if (!this.hasOwnProperty('rowNumber') || 
                this.rowNumber != false) {
                this.fixedCols.unshift({title:'&#46;&#35;'});
                this.subColsInFixedCols.push({title:'&#46;&#35;'});
            }
            this.renderFixedColumns();
            this.renderColumns();
        },

        /**
         * Render columns with fixed positions.
         */
        renderFixedColumns: function() {
            this._topLeftTable = $("<table>").addClass("top-left-table"); 

            if (this.hasSubCol(this.fixedCols)) {
                this.hasSubColsInFixedCols = true;
                this.renderHiddenRow(this.fixedCols)
                    .appendTo(this._topLefttTable);
                this.rowCount(this.fixedCols);
                this.renderSubColHeadings(this.fixedCols, this._topLeftTable, "top-left-table");
                this.colNum = 0;
                this.rowNum = 0;
                this.rowLength = [];
            }
            else {
                var $row = $("<tr>");
                this.renderColHeadings($row, this.fixedCols, "top-left-table")
                    .appendTo(this._topLeftTable);
            }
            
            this._topLeftTable.appendTo(this._topLeftContainer);
        },

        /**
         * Render columns with flexible positions.
         */
        renderColumns: function() {
            this._topRightTable = $("<table id='overflow'>").addClass("top-right-table");

            if (this.hasSubCol(this.cols)) {
                this.hasSubCols = true;
                this.renderHiddenRow(this.cols)
                    .appendTo(this._topRightTable);
                this.rowCount(this.cols);
                this.renderSubColHeadings(this.cols, this._topRightTable, "top-right-table");
                this.colNum = 0;
                this.rowNum = 0;
                this.rowLength = [];
            }
            else {
                var $row = $("<tr>");
                this.renderColHeadings($row, this.cols, "top-right-table")
                    .appendTo(this._topRightTable);
            }

            this._topRightTable.appendTo(this._topRightContainer);
        },

        /**
         * Check if sub-columns exist in the column models 
         *     (this.cols[] && this.fixedCols[]). 
         */
        hasSubCol: function(cols) {
            var i;
            for (i = 0; i < cols.length; i++) {
                if (cols[i].cols && cols[i].cols.length > 0) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Render column headings that do not have sub-columns.
         */
        renderColHeadings: function($row, cols, className) {
            this._eachCol(cols, function(col) {
                $th = $("<th>").addClass(className + "-cells")
                    .append($("<div id='cell'>")
                    .append($("<p>").append(col.title)
                    ));
                $th.appendTo($row);
            });
            return $row;
        },

        /**
         * Render column headings that posseses sub-columns.
         */
        renderSubColHeadings: function(cols, $table, className) {
            var $row = $("<tr>"); 
            var i;
            var subCols = [];
			
			for (i = 0; i < cols.length; i++) {
				$th = $("<th>").addClass(className + "-cells")
                    .append($("<div id='cell'>")
                    .append($("<p>").append(cols[i].title)
                    ));
					  
				if (cols[i].cols && cols[i].cols.length > 0) {
					var k;         
					for (k = 0; k < cols[i].cols.length; k++) {
                        subCols.push(cols[i].cols[k]);
                        if (this.hasSubCols && !this.subColsInFixedCols.indexOf(cols[i].cols[k]) !== -1)
                            this.subCols.push(cols[i].cols[k]);
                        if (this.hasSubColsInFixedCols && this.subCols.indexOf(cols[i].cols[k]) !== -1)
                            this.subColsInFixedCols.push(cols[i].cols[k]);
					}    
					this.colNum = 0;
					this.colCount(cols[i].cols);
					$th.attr("colspan", this.colNum);
				}
				else {
					$th.attr("rowspan", this.rowNum);
				}
                $th.appendTo($row);
                $table.addClass(className).append($row);
				if (i == cols.length - 1) {
					this.rowNum--;
					this.renderSubColHeadings(subCols, $table, className);
				}
            }
		},
        
        /**
         * Calculate how many columns in total that a header or
         * just a column/sub-column has. 
         */
		colCount: function(cols) {
			var i;
			for (i = 0; i < cols.length; i++) {
				if (cols[i].cols && cols[i].cols.length > 0)
					this.colCount(cols[i].cols);
				else
					this.colNum++;
			}
		},
        
        /**
         * Calculate how many rows in total that a header has.
         */
		rowCount: function(cols) {
			var i;
			for (i = 0; i < cols.length; i++) {
				if(cols[i].cols && cols[i].cols.length > 0) 
					this.rowCountHelper(cols[i].cols);
				this.rowNum++;
				this.rowLength.push(this.rowNum);
				this.rowNum = 0;
			}
		},
        
        /**
         * Helper for rowCount().
         */
		rowCountHelper: function(cols) {
			var i;
			for (i = 0; i < cols.length; i++) {    
				if (cols[i].cols && cols[i].cols.length > 0)   
					this.rowCountHelper(cols[i].cols);             
			}
			this.rowNum++;   
        },
        
		/**
         * Render a hidden row that will be used
         * to control the width of columns that
         * contain sub-columns.
         */
		renderHiddenRow: function(cols) {
			//cols = 0;
			this.colCount(cols);
			var i;
			$tr = $('<tr style="visibility:hidden">');
			for (i = 0; i < this.colNum; i++) {
				$td = $("<td>");
				$tr.append($td);
			}
			this.colNum = 0;
			return $tr;
		},

        /**
         * Create table body.
         */
        createBody: function() {
            this._bottomLeftTable = $("<table>").addClass("bottom-left-table");
            var $content = this._content = $("<table id='table-body'>").addClass("bottom-right-table");            
            var $bottomRightTable = this._bottomRightTable = $content;
            return $bottomRightTable;
        },

        /**
         * Create row headings.
         */
        createRowHeader: function() {

        },

        /**
         * Attach data to the table body.
         */
        attachData: function() {

        },

        /**
         * Iterate column model, customized manipulations
         * on each column can be applied through customized
         * callback function provided by users.
         */
        _eachCol: function(cols, callBack) {
            var self = this;
            $.each(cols, function(index, col) {
                //if(field.visible) {
                    callBack.call(self, col, index);
                //}
            });
        },

        /**
         * Put data on the instant field 'this.data[]'.
         * The data from other sources can be imported
         * through the customized callback function.
         */
        loadData: function(filter) {
            /*
            filter = filter || (this.filtering ? this.getFilter() : {});

            $.extend(filter, this._loadStrategy.loadParams(), this._sortingParams());
			*/
            var args = this._callEventHandler(this.onDataLoading, {
                filter: filter
            });

            return this._controllerCall("loadData", filter, args.cancel, function(loadedData) {
                if(!loadedData)
                    return;

                //this._loadStrategy.finishLoad(loadedData);
                this.data = loadedData;
                this._refreshContent();
                this._callEventHandler(this.onDataLoaded, {
                    data: loadedData
                });
            });
        },

        _refreshContent: function() {
            var $content = this._content;
            $content.empty();

            if(!this.data.length) {
                $content.append(this._createNoDataRow());
                return this;
            }

            var indexFrom = 0;
            var indexTo = this.data.length;
            if (this.hasSubCols) {
                this.createColGroup();
            }

            for(var itemIndex = indexFrom; itemIndex < indexTo; itemIndex++) {
                var item = this.data[itemIndex];
                this._createRow(item, itemIndex);
            }
            this._bottomLeftTable.appendTo(this._bottomLeftContainer);
            this._bottomRightTable.appendTo(this._bottomRightContainer);

            this._refreshSize();

            $("#overflow").colResizable({
                liveDrag:true,
                resizeMode:'overflow'
            });
        },

        createColGroup: function() {
            var i;
            var len = this.subCols.length;
            var $colgroup = $("<colgroup>");
            for (i = 0; i < len; i++) {
                $colgroup.append("<col>");
            }
            this._bottomRightTable.append($colgroup);
        },

        _createRow: function(item, itemIndex) {
            var $rowWithFixedCols = $("<tr>");
            if (!this.hasOwnProperty('rowNumber') || this.rowNumber != false) {
                $rowWithFixedCols.append($("<td>").addClass("row-number-cells").append(
                    $("<div id='cell'>")
                        .append($("<p>").append(itemIndex+1))));
            }

            if (this.hasSubColsInFixedCols) {
                this._renderCells(this.subColsInFixedCols, $rowWithFixedCols, item, this._bottomLeftTable);
            }
            else
                this._renderCells(this.fixedCols, $rowWithFixedCols, item, this._bottomLeftTable);

            var $row = $("<tr>");
            if (this.hasSubCols) {
                this._renderCells(this.subCols, $row, item, this._content);
            }
            else
                this._renderCells(this.cols, $row, item, this._content);
            /*
            $row.addClass(this._getRowClasses(item, itemIndex))
                .data(JSGRID_ROW_DATA_KEY, item)
                .on("click", $.proxy(function(e) {
                    this.rowClick({
                        item: item,
                        itemIndex: itemIndex,
                        event: e
                    });
                }, this))
                .on("dblclick", $.proxy(function(e) {
                    this.rowDoubleClick({
                        item: item,
                        itemIndex: itemIndex,
                        event: e
                    });
                }, this));

            if(this.selecting) {
                this._attachRowHover($row);
            }*/
            //return $row;
        },

        _renderCells: function($cols, $row, item, $table) {
            $row.addClass($table.attr('class') + "-rows");
			this._eachCol($cols, function(col) {
                $row.append(this._createCell(item, col, $table.attr('class')));
            });
            $table.append($row);
            return this;
        },

        _createCell: function(item, col, className) {
            var $result;
            var colVal = item[col.title];
            
            if (colVal !== undefined) {
                $result = $("<td>").addClass(className + "-cells")
                    .append($("<div id='cell'>")
                    .append($("<p>").append(colVal)
                    ));
            }

            return $result;
        },

        refresh: function() {
            this._refreshSize();
			this._refreshContent();
        },

        _refreshSize: function() {
            this._refreshWidth();
            this._refreshHeight();
        },

        _refreshWidth: function() {
            var newWidth=0;
            var container = this._container,
                width = this._topLeftTable.outerWidth() + this._topRightTable.outerWidth();

            if (this.width)
                width = this.width;
            container.width(width);

            this._bottomLeftTable.outerWidth(this._topLeftTable.outerWidth());
            this._bottomRightTable.outerWidth(this._topRightTable.outerWidth());
            
            var $topLeftTable = this._topLeftTable;
            newWidth = $topLeftTable.outerWidth();
            $(this._bottomLeftContainer).innerWidth(newWidth + 17);
            $(this._outerBottomLeftContainer).innerWidth(newWidth);

            newWidth = $(this._container).width() - $(this._leftContainer).width();
            $(this._rightContainer).width(newWidth);

        },

        _refreshHeight: function() {
            var newHeight=0;
            var container = this._container,
                height = 300;

            if (this.height)
                height = this.height;
            container.height(height);

            newHeight = $(this._topRightTable).outerHeight();
            $(this._topRightContainer).innerHeight(newHeight + 17);
            $(this._outerTopRightContainer).innerHeight(newHeight);
            
            $(this._bottomLeftContainer).outerHeight($(this._container).innerHeight() - $(this._topLeftContainer).outerHeight());
            $(this._bottomRightContainer).outerHeight($(this._container).innerHeight()- $(this._topLeftContainer).outerHeight());

            if (this._topRightTable.height() > this._topLeftTable.height())
                this._topLeftTable.outerHeight(this._topRightTable.outerHeight());
            else
                this._topRightTable.outerHeight(this._topLeftTable.outerHeight());
        },

        _controllerCall: function(method, param, isCanceled, doneCallback) {
            if(isCanceled)
                return $.Deferred().reject().promise();

            //this._showLoading();

            var dataOps = this._dataOps;
            if(!dataOps || !dataOps[method]) {
                throw Error("controller has no method '" + method + "'");
            }

            return normalizePromise(dataOps[method](param))
                .done($.proxy(doneCallback, this))
                //.fail($.proxy(this._errorHandler, this))
                //.always($.proxy(this._hideLoading, this));
        },

        _callEventHandler: function(handler, eventParams) {
            handler.call(this, $.extend(eventParams, {
                grid: this
            }));

            return eventParams;
        }

    };

}(window, jQuery));