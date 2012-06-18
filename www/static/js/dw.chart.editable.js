(function(){

    // Datawrapper.EditableChart
    // -------------------------

    //
    var EditableChart = Datawrapper.EditableChart = function(attributes) {
        this.__attributes = attributes;
        this.__changed = false;
        this.__changeCallbacks = [];
        this.__saveCallbacks = [];
    };

    _.extend(EditableChart.prototype, Datawrapper.Chart.prototype, {

        set: function(key, value) {
            var keys = key.split('.'),
                me = this,
                lastKey = keys.pop(),
                pt = me.__attributes;

            // resolve property
            _.each(keys, function(key) {
                pt = pt[key];
            });
            // check if new value is set
            if (pt[lastKey] != value) {
                pt[lastKey] = value;
                me.__changed = true;
                if (me.__saveTimeout) clearTimeout(me.__saveTimeout);
                me.__saveTimeout = setTimeout(function() {
                    me.save();
                }, 1000);
                _.each(me.__changeCallbacks, function(cb) {
                    cb.call(this, me);
                });
            }
            return this;
        },

        onChange: function(callback) {
            this.__changeCallbacks.push(callback);
        },

        sync: function(el, attribute) {
            if (_.isString(el)) el = $(el);
            el.data('sync-attribute', attribute);

            var curVal = this.get(attribute);
            if (el.is('input[type=checkbox]')) {
                if (curVal) el.attr('checked', 'checked');
                else el.removeAttr('checked');
            } else if (el.is('input[type=text]') || el.is('textarea') || el.is('select')) {
                el.val(curVal);
            } else if (el.is('input[type=radio]')) {
                $('input:radio[name='+el.attr('name')+'][value='+curVal+']').checked = true;
            }

            var chart = this;
            el.change(function(evt) {
                var el = $(evt.target),
                    attr, val;

                // Resolve attribute string to a pointer to the attribute
                attr = el.data('sync-attribute');

                if (el.is('input[type=checkbox]')) {
                    val = el.attr('checked') == 'checked';
                } else if (el.is('input[type=text]') || el.is('textarea') || el.is('select')) {
                    val = el.val();
                } else if (el.is('input[type=radio]')) {
                    val = $('input:radio[name='+el.attr('name')+']:checked').val();
                }
                if (val !== undefined) {
                    chart.set(attr, val);
                }
            });
        },

        onSave: function(callback) {
            this.__saveCallbacks.push(callback);
        },

        save: function() {
            // saves the chart meta data to Datawrapper
            if (!this.__changed) return;
            $.ajax({
                url: '/api/charts/'+this.get('id'),
                type: 'PUT',
                dataType: 'json',
                data: JSON.stringify(this.__attributes),
                processData: false,
                context: this,
                success: function(data) {
                    if (data.status == "ok") {
                        this.__changed = false;
                        // run callbacks
                        _.each(this.__saveCallbacks, function(cb) {
                            cb.call(this);
                        });
                    } else {
                        console.warn('could not save the chart', data);
                    }
                }
            });
        }
    });

}).call(this);