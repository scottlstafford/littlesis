// Generated by CoffeeScript 1.6.2
(function() {
  var LittlesisApi, Netmap;

  LittlesisApi = (function() {
    function LittlesisApi(key) {
      this.key = key;
      this.base_url = "http://api.littlesis.org/";
    }

    LittlesisApi.prototype.entity_and_rels_url = function(entity_ids) {
      return this.base_url + "map/entities.json?entity_ids=" + entity_ids.join(",") + "&_key=" + this.key;
    };

    LittlesisApi.prototype.entity_and_rels = function(entity_ids, callback) {
      var url;

      url = this.entity_and_rels_url(entity_ids);
      return $.ajax({
        url: url,
        success: callback,
        dataType: "json"
      });
    };

    return LittlesisApi;

  })();

  Netmap = (function() {
    function Netmap(width, height, parent_selector, key) {
      this.width = width;
      this.height = height;
      this.init_svg(parent_selector);
      this.force_enabled = false;
      this.entity_background_opacity = 0.6;
      this.entity_background_color = "#fff";
      this.entity_background_corner_radius = 0;
      this.distance = 225;
      this.api = new LittlesisApi(key);
    }

    Netmap.prototype.set_data = function(data, center_entity_id) {
      var r, _i, _len, _ref, _results;

      if (center_entity_id == null) {
        center_entity_id = null;
      }
      this._data = data;
      if (center_entity_id != null) {
        this.set_center_entity_id(center_entity_id);
      }
      this._entity_ids = this._data["entities"].map(function(e) {
        return e.id;
      });
      _ref = this._data["rels"];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        r = _ref[_i];
        r.source = this._data["entities"][r.source];
        _results.push(r.target = this._data["entities"][r.target]);
      }
      return _results;
    };

    Netmap.prototype.data = function() {
      return this._data;
    };

    Netmap.prototype.entity_ids = function() {
      return this._entity_ids;
    };

    Netmap.prototype.rel_ids = function() {
      return this._rel_ids;
    };

    Netmap.prototype.add_entity = function(id) {
      var t;

      if (!(this._entity_ids.indexOf(id) > -1)) {
        this._entity_ids.push(id);
      }
      t = this;
      return this.api.entity_and_rels(this._entity_ids, function(data) {
        t.set_data(data, t.center_entity_id);
        t.build();
        return t.wheel();
      });
    };

    Netmap.prototype.set_center_entity_id = function(id) {
      var entity, _i, _len, _ref, _results;

      this.center_entity_id = id;
      _ref = this._data["entities"];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entity = _ref[_i];
        if (entity.id === this.center_entity_id) {
          entity.fixed = true;
          entity.x = this.width / 2;
          _results.push(entity.y = this.height / 2);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Netmap.prototype.init_svg = function(parent_selector) {
      this.svg = d3.select(parent_selector).append("svg").attr("id", "svg").attr("width", this.width).attr("height", this.height);
      return window.svg = this.svg;
    };

    Netmap.prototype.wheel = function(center_entity_id) {
      var angle, count, entity, i, _i, _len, _ref;

      if (center_entity_id == null) {
        center_entity_id = null;
      }
      if (this.center_entity_id != null) {
        center_entity_id = this.center_entity_id;
      }
      count = 0;
      _ref = this._data["entities"];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        entity = _ref[i];
        if (parseInt(entity.id) === center_entity_id) {
          this._data["entities"][i].x = this.width / 2;
          this._data["entities"][i].y = this.height / 2;
        } else {
          angle = (2 * Math.PI / (this._data["entities"].length - (center_entity_id != null ? 1 : 0))) * count;
          this._data["entities"][i].x = this.width / 2 + this.distance * Math.cos(angle);
          this._data["entities"][i].y = this.height / 2 + this.distance * Math.sin(angle);
          count++;
        }
      }
      return this.update_positions();
    };

    Netmap.prototype.update_positions = function() {
      d3.selectAll(".entity").attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
      d3.selectAll(".rel").attr("transform", function(d) {
        return "translate(" + (d.source.x + d.target.x) / 2 + "," + (d.source.y + d.target.y) / 2 + ")";
      });
      d3.selectAll(".line").attr("x1", function(d) {
        return d.source.x - (d.source.x + d.target.x) / 2;
      }).attr("y1", function(d) {
        return d.source.y - (d.source.y + d.target.y) / 2;
      }).attr("x2", function(d) {
        return d.target.x - (d.source.x + d.target.x) / 2;
      }).attr("y2", function(d) {
        return d.target.y - (d.source.y + d.target.y) / 2;
      });
      return d3.selectAll(".rel text").attr("transform", function(d) {
        var angle, x_delta, y_delta;

        x_delta = d.target.x - d.source.x;
        y_delta = d.target.y - d.source.y;
        angle = Math.atan2(y_delta, x_delta) * 180 / Math.PI;
        if (d.source.x >= d.target.x) {
          angle += 180;
        }
        return "rotate(" + angle + ")";
      });
    };

    Netmap.prototype.use_force = function() {
      this.force_enabled = true;
      this.force = d3.layout.force().gravity(.3).distance(this.distance).charge(-5000).friction(0.7).size([this.width, this.height]).nodes(this._data["entities"]).links(this._data["rels"]).on("tick", this.update_positions).start();
      if ((this.alpha != null) && this.alpha > 0) {
        return this.force.alpha(this.alpha);
      }
    };

    Netmap.prototype.one_time_force = function() {
      this.use_force();
      this.force.alpha(0.01);
      return this.force.on("end", function() {
        return this.force_enabled = false;
      });
    };

    Netmap.prototype.deny_force = function() {
      this.force_enabled = false;
      this.alpha = this.force.alpha();
      return this.force.stop();
    };

    Netmap.prototype.n_force_ticks = function(n) {
      var _i;

      this.use_force();
      for (_i = 1; 1 <= n ? _i <= n : _i >= n; 1 <= n ? _i++ : _i--) {
        this.force.tick();
      }
      return this.deny_force();
    };

    Netmap.prototype.build = function() {
      this.build_rels();
      this.build_entities();
      return this.entities_on_top();
    };

    Netmap.prototype.build_rels = function() {
      var groups, rels;

      rels = this.svg.selectAll(".rel").data(this._data["rels"]);
      groups = rels.enter().append("g").attr("class", "rel");
      groups.append("line").attr("class", "line").attr("opacity", 0.6).style("stroke-width", function(d) {
        return Math.sqrt(d.value) * 12;
      });
      groups.append("a").attr("xrel:href", function(d) {
        return d.url;
      }).append("text").attr("dy", function(d) {
        return Math.sqrt(d.value) * 10 / 2 - 1;
      }).attr("text-anchor", "middle").text(function(d) {
        return d.label;
      });
      rels.exit().remove();
      this.svg.selectAll(".rel .line").data(this._data["rels"]);
      this.svg.selectAll(".rel a").data(this._data["rels"]).on("click", function(d) {
        return window.location.href = d.url;
      });
      return this.svg.selectAll(".rel text").data(this._data["rels"]);
    };

    Netmap.prototype.build_entities = function() {
      var entities, entity_drag, groups, has_image, links, t;

      t = this;
      entity_drag = d3.behavior.drag().on("dragstart", function(d, i) {
        t.alpha = t.force.alpha();
        return t.force.stop();
      }).on("drag", function(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        return t.update_positions();
      }).on("dragend", function(d, i) {
        d.fixed = true;
        return t.force.alpha(t.alpha);
      });
      entities = this.svg.selectAll(".entity").data(this._data["entities"]);
      groups = entities.enter().append("g").attr("class", "entity").call(entity_drag);
      has_image = function(d) {
        return d.image.indexOf("anon") === -1;
      };
      groups.append("rect").attr("fill", this.entity_background_color).attr("opacity", 1).attr("rx", this.entity_background_corner_radius).attr("ry", this.entity_background_corner_radius).attr("width", function(d) {
        if (has_image(d)) {
          return 58;
        } else {
          return 43;
        }
      }).attr("height", function(d) {
        if (has_image(d)) {
          return 58;
        } else {
          return 43;
        }
      }).attr("x", function(d) {
        if (has_image(d)) {
          return -29;
        } else {
          return -21;
        }
      }).attr("y", function(d) {
        if (has_image(d)) {
          return -29;
        } else {
          return -29;
        }
      }).attr("stroke", "#f8f8f8").attr("stroke-width", 1);
      groups.append("image").attr("class", "image").attr("opacity", function(d) {
        if (has_image(d)) {
          return 1;
        } else {
          return 0.5;
        }
      }).attr("xlink:href", function(d) {
        return d.image;
      }).attr("x", function(d) {
        if (has_image(d)) {
          return -25;
        } else {
          return -17;
        }
      }).attr("y", function(d) {
        if (has_image(d)) {
          return -25;
        } else {
          return -25;
        }
      }).attr("width", function(d) {
        if (has_image(d)) {
          return 50;
        } else {
          return 35;
        }
      }).attr("height", function(d) {
        if (has_image(d)) {
          return 50;
        } else {
          return 35;
        }
      });
      links = groups.append("a").attr("xlink:href", function(d) {
        return d.url;
      }).attr("title", function(d) {
        return d.description;
      });
      links.append("text").attr("dx", 0).attr("dy", function(d) {
        if (has_image(d)) {
          return 40;
        } else {
          return 25;
        }
      }).attr("text-anchor", "middle").text(function(d) {
        return d.name.replace(/^(.{8,}[\s-]+).+$/, "$1").trim();
      });
      links.append("text").attr("dx", 0).attr("dy", function(d) {
        if (has_image(d)) {
          return 55;
        } else {
          return 40;
        }
      }).attr("text-anchor", "middle").text(function(d) {
        var second_part;

        second_part = d.name.replace(/^.{8,}[\s-]+(.+)$/, "$1");
        if (d.name === second_part) {
          return "";
        } else {
          return second_part;
        }
      });
      /*
      # one or two rectangles behind the entity name
      entities.enter().filter((d) -> d.name.match(/^(.{8,})[\s-]+.+$/) != null)
        .insert("rect", ":first-child")
        .attr("fill", @entity_background_color)
        .attr("opacity", @entity_background_opacity)
        .attr("rx", @entity_background_corner_radius)
        .attr("ry", @entity_background_corner_radius)
        .attr("x", (d) -> 
          -$(this.parentNode).find("text:nth-child(2)").width()/2 - 3
        )
        .attr("y", (d) ->
          image_offset = $(this.parentNode).find("image").attr("height")/2
          text_offset = $(this.parentNode).find("text").height()
          extra_offset = if has_image(d) then 2 else -5
          image_offset + text_offset + extra_offset
        )
        .attr("width", (d) -> $(this.parentNode).find("text:nth-child(2)").width() + 6)
        .attr("height", (d) -> $(this.parentNode).find("text:nth-child(2)").height() + 4)
      
      entities.enter().insert("rect", ":first-child")
        .attr("fill", @entity_background_color)
        .attr("opacity", @entity_background_opacity)
        .attr("rx", @entity_background_corner_radius)
        .attr("ry", @entity_background_corner_radius)
        .attr("x", (d) ->
          -$(this.parentNode).find("text").width()/2 - 3
        )
        .attr("y", (d) ->
          image_offset = $(this.parentNode).find("image").attr("height")/2
          extra_offset = if has_image(d) then 1 else -6
          image_offset + extra_offset
        )
        .attr("width", (d) -> $(this.parentNode).find("text").width() + 6)
        .attr("height", (d) -> $(this.parentNode).find("text").height() + 4)
      */

      return entities.exit().remove();
    };

    Netmap.prototype.entities_on_top = function() {
      var svg;

      svg = $("#svg");
      return $("g.rel").each(function(i, g) {
        return $(g).prependTo(svg);
      });
    };

    return Netmap;

  })();

  if (typeof module !== "undefined" && module.exports) {
    exports.Netmap = Netmap;
  } else {
    window.Netmap = Netmap;
  }

}).call(this);
