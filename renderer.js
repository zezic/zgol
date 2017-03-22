// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var THREE = require("three-js")();
var webgl = require("./webgl.js")
var planes = webgl.planes
var camera = webgl.camera
var canvas = webgl.canvas
var ctx = webgl.ctx
window.ctx = ctx
var scene = webgl.scene
var renderer = webgl.renderer
var field_width = webgl.field_size
var texture = webgl.texture
window.texture = texture
var iterations = 0

var wh = '#ffffff'
var bl = '#000000'
var rr = '#440000'


function changeCanvas() {
  mutation.map(function(row, y) {
    row.map(function(m, x) {
      if (m == 1) {
        ctx.fillStyle = wh
        ctx.fillRect(x, y, 1, 1)
      }
      //} else if (m == -1) {
        //ctx.fillStyle = rr
        //ctx.fillRect(x, y, 1, 1)
      //}
    })
  })
  texture.needsUpdate = true
    //ctx.font = '20pt Arial';
    //ctx.fillStyle = 'red';
    //ctx.fillRect(0, 0, canvas.width, canvas.height);
    //ctx.fillStyle = 'white';
    //ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
    //ctx.fillStyle = 'black';
    //ctx.textAlign = "center";
    //ctx.textBaseline = "middle";
    //ctx.fillText(Math.round(Math.random()*100, 2), canvas.width / 2, canvas.height / 2);
}

var ZGol = function(options) {
  this.init(options)
}

ZGol.prototype.init = function(options) {
  if (typeof options == "undefined") {
    options = {}
  }
  var default_options = {
    field: {
      width: 160,
      height: 160
    }
  }

  if (!("ctx" in options)) {
    console.error("WHERE IS YOUR CTX?")
    return
  }

  if ("afterRender" in options) {
    this.afterRender = options.afterRender
  } else {
    this.afterRender = function () {}
  }

  this.options = Object.assign(default_options, options)

  this.state = []
  for (var i = 0; i < this.options.field.height; i++) {
    this.state.push([])
  }

  var relative_moore = {}

  var sides = {
    nw: [-1, -1], n:  [ 0, -1], ne: [ 1, -1],
    w:  [-1,  0], c:  [ 0,  0], e:  [ 1,  0],
    sw: [-1,  1], s:  [ 0,  1], se: [ 1,  1]
  }

  var bounds = [this.options.field.width - 1, this.options.field.height - 1]

  for (var side in sides) {
    var offset = sides[side]
    relative_moore[side] = []
    for (var n in sides) {
      var coords = [sides[n][0], sides[n][1]]
      for (var pos in offset) {
        if (coords[pos] == offset[pos] && coords[pos] != 0) {
          if (offset[pos] == 1) {
            coords[pos] = bounds[pos] * -1
          } else {
            coords[pos] = bounds[pos]
          }
        }
      }
      if (!(coords[0] == 0 && coords[1] == 0)) {
        relative_moore[side].push(coords)
      }
    }
  }

  this.moore = []
  
  for (var y = 0; y < this.options.field.height; y++) {
    this.moore[y] = []
    for (var x = 0; x < this.options.field.width; x++) {
      var coords = [x, y]
      this.moore[y][x] = []
      var bump = [0, 0]
      for (var idx in [0, 1]) {
        if (coords[idx] == 0) {
          bump[idx] = -1
        }
        if (coords[idx] == bounds[idx]) {
          bump[idx] = 1
        }
      }
      var side_name = ""
      for (var side in sides) {
        if (sides[side][0] == bump[0] && sides[side][1] == bump[1]) {
          side_name = side
        }
      }
      var coords_moore = relative_moore[side_name]
      coords_moore.map(function(moore) {
        this.moore[y][x].push([coords[0] + moore[0], coords[1] + moore[1]])
      }.bind(this))
    }
  }

  this.ctx = this.options.ctx
}

ZGol.prototype.addCell = function(cell) {
  this.state[cell.coords.y][cell.coords.x] = cell
}

ZGol.prototype.removeCell = function(cell) {
  delete this.state[cell.coords.y][cell.coords.x]
}

ZGol.prototype.addPattern = function(cells) {
  cells.map(function(coords) {
    this.addCell({
      coords: {
        x: coords[0],
        y: coords[1]
      }
    })
  }.bind(this))
  this.renderState()
}

ZGol.prototype.instantMoore = function(coords) {
  return this.moore[coords[1]][coords[0]]
}

ZGol.prototype.aliveInMoore = function(coords) {
  var alive_count = 0
  this.moore[coords[1]][coords[0]].map(function(moo) {
    if (this.state[moo[1]][moo[0]]) {
      alive_count++
    }
  }.bind(this))
  return alive_count
}

ZGol.prototype.computeMutation = function(coords, computed, mutation) {
  var x = coords[0]
  var y = coords[1]
  if (!(computed[y])) {
    computed[y] = []
  }
  if (!(mutation[y])) {
    mutation[y] = []
  }
  if (!(computed[y][x])) {
    computed[y][x] = true
    var alive_count = this.aliveInMoore(coords)
    var current_state = this.state[y][x]
    if (alive_count == 3) {
      if (!current_state) {
        mutation[y][x] = 1
      }
    } else if (alive_count < 2 || alive_count > 3) {
      if (current_state) {
        mutation[y][x] = -1
      }
    }
  }
}

ZGol.prototype.mutate = function() {
  var mutation = []
  var computed = []
  for (var y in this.state) {
    y = parseInt(y)
    for (var x in this.state[y]) {
      x = parseInt(x)
      var coords_at_risk = [[x, y]].concat(this.instantMoore([x, y]))
      coords_at_risk.map(function(coords) {
        this.computeMutation(coords, computed, mutation)
      }.bind(this))
    }
  }
  for (var y in mutation) {
    y = parseInt(y)
    for (var x in mutation[y]) {
      x = parseInt(x)
      var mut = mutation[y][x]
      if (mut == 1) {
        this.addCell({coords: {x: parseInt(x), y: parseInt(y)}})
      } else {
        delete this.state[y][x]
      }
    }
  }
  this.renderMutation(mutation)
}

ZGol.prototype.renderState = function() {
  for (var y in this.state) {
    y = parseInt(y)
    for (var x in this.state[y]) {
      x = parseInt(x)
      ctx.fillStyle = wh
      ctx.fillRect(x, y, 1, 1)
    }
  }
  this.afterRender()
}

ZGol.prototype.renderMutation = function(mutation) {
  for (var y in mutation) {
    y = parseInt(y)
    for (var x in mutation[y]) {
      x = parseInt(x)
      if (mutation[y][x] == 1) {
        ctx.fillStyle = wh
      } else {
        ctx.fillStyle = bl
      }
      ctx.fillRect(x, y, 1, 1)
    }
  }
  this.afterRender()
}

window.ZGol = ZGol;


var black = new THREE.MeshBasicMaterial( { color: 0x222222, wireframe: true } );
var white = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } );

var engine_running = false

var mutation = []
var flame = []
var state = []
var glider = [
             [2,0],
 [0,1],      [2,1],
       [1,2],[2,2]
]
window.glider = glider

var beehive = [
       [1,0],[2,0],
 [0,1],            [3,1],
       [1,2],[2,2],
             [2,3]
]
window.beehive = beehive

for (var i = 0; i < field_width; i++) {
  mutation.push(new Array(field_width).fill(0))
  flame.push(new Array(field_width).fill(0))
  state.push(new Array(field_width).fill(0))
}

glider.map(function(coords) {
  state[coords[1]][coords[0]] = 1
})

var moore = [
  [-1,-1], [ 0,-1], [ 1,-1],
  [-1, 0],          [ 1, 0],
  [-1, 1], [ 0, 1], [ 1, 1]
]

function toroide(coord) {
  if (coord >= field_width) {
    return coord - field_width
  } else if (coord < 0) {
    return field_width + coord
  }
  return coord
}

function getOffset(coords, offset_x, offset_y, mtrx) {
  return mtrx[toroide(coords[1] + offset_y)][toroide(coords[0] + offset_x)]
}

function mutateField() {
  if (!engine_running) {
    return
  }

  iterations++
  console.log(iterations)

  requestAnimationFrame(mutateField)

  state.map(function(row, y) {
    row.map(function(st, x) {
      var alive_count = 0;
      moore.map(function(moo) {
        alive_count += getOffset([x, y], moo[0], moo[1], state)
      })
      // It's slow:
      //var alive_count = siblings.reduce(function(prev, cur, index) {
        //return prev + cur
      //})
      // So use this:
      //for (var i = siblings.length; i--;) {
        //alive_count += siblings[i]
      //}
      if (alive_count == 3) {
        // Born
        mutation[y][x] = 1
        // Less flame
      } else if (alive_count < 2 || alive_count > 3) {

        // Die
        // Simply die
        if (alive_count > 7) {
          mutation[y][x] = -3
          flame[y][x] = 10
        } else if (alive_count > 5) {
          mutation[y][x] = -2
          flame[y][x] = 10
        } else {
          mutation[y][x] = -1
          flame[y][x]--
        }
        // Less flame

      } else {
        // Survive
        mutation[y][x] = 0
      }

    })
  })


  mutation.map(function(row, y) {
    row.map(function(mut, x) {
      if (mut > 0) {
        //planes[y][x].material = white
        state[y][x] = 1
        //matrix[y][x].classList.remove("fire")
      } 
      if (mut < 0) {
        if (state[y][x] != 0) {
          //planes[y][x].material = black
          state[y][x] = 0
        }

        if (mut == -2) {
          //matrix[y][x].classList.add("fire")
        } else if (mut == -3) {
          //matrix[y][x].classList.add("scarlet")
        }

      } 
    })
  })
  flame.map(function(row, y) {
    row.map(function(flm, x) {
      if (flm == 0) {
        //matrix[y][x].classList.remove("fire")
        //matrix[y][x].classList.remove("scarlet")
      } 
    })
  })
  changeCanvas()
}

document.addEventListener('keypress', function (e) {
  if (e.which == 32) {
    engine_running = !engine_running
    if (engine_running) {
      mutateField()
    }
  }
})

function onMouseDown(e) {
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();

  mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( scene.children );
  if (intersects.length > 0) {
    var plane = intersects[0];
    var x = plane.object.userData.x;
    var y = plane.object.userData.y;
    plane.object.material = white;
    state[y][x] = 1;
  }
}

window.addEventListener( 'mousedown', onMouseDown, false );
