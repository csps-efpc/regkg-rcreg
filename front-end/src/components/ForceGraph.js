import React from "react";
import PropTypes from "prop-types";
import { scaleOrdinal, schemeCategory10 } from "d3";
import {
  forceSimulation,
  forceLink,
  forceCollide,
  forceX,
  forceY,
  forceManyBody
} from "d3-force";

class ForceGraph extends React.Component {


  constructor(props) {
    super(props);
    this.color = scaleOrdinal(schemeCategory10);
    this.state = {
      nodes: props.props.nodes,
      links: props.props.links
    };
  
  }

  componentDidMount() {
    const { nodes, links } = this.state;
    
    this.simulation = forceSimulation(nodes)
      .force(
        "link",
        forceLink()
          .id((d) => d.id)
          .links(links)
          .distance(100)
          .strength(0.9)
      )
      .force("x", forceX(this.props.width / 2).strength(0.7))
      .force("y", forceY(this.props.height / 2).strength(0.5))
      .force("charge", forceManyBody().strength(-1200))
      .force("collide", forceCollide(this.props.radius));

    this.simulation.on("tick", () =>
      this.setState({
        links: this.state.links,
        nodes: this.state.nodes
      })
    );
    this.simulation.on("end", () => console.log("simulation end"));
  }

  componentWillUnmount() {
    this.simulation.stop();
  }

  render() {
    const { width, radius, height } = this.props;
    const { nodes, links } = this.state;
    
    return (
      <svg className="forceGraph" height={height} width={width}>
        <defs>
          <marker
            id="suit"
            viewBox="0 -5 10 10"
            refX={13}
            refY={0}
            markerWidth={13}
            markerHeight={13}
            xoverflow={"visible"}
            orient="auto"
          >
            <path
              d="M 0,-5 L 10 ,0 L 0,5"
              stroke="none"
              fill={"#999"}
              opacity={0.9}
            />
          </marker>
        </defs>
        {/* Our visualization should go here. */}
        <g>
          {
          (nodes ? nodes : []).map((n) => (
            <g>
            <a href={n.href}>
                <circle cx={n.x} cy={n.y} r={radius} fill={this.color(n.type)} stroke="#000" />
              </a>
              <text textAnchor="middle" x={n.x} y={n.y - radius}>
                {n.name}
              </text>
            </g>
          ))}
          {
          (links ? links : []).map((link, index) => (
            <g><line
              x1={link.source.x }
              y1={link.source.y }
              x2={link.target.x }
              y2={link.target.y }
              key={`line-${index}`}
              stroke={this.color(link.name)}
              markerEnd="url(#suit)"
            />
            <path
            fillOpacity={0}
            strokeOpacity={0}
            id={"edge-" + link.source.id + "-" + link.target.id}
            style={{
                pointerEvents:"none"
            }}
            d={'M ' + link.source.x + ' ' + link.source.y + ' L ' + link.target.x + ' ' + link.target.y}
            />
            <text
            style={{pointerEvents: "none"}}
            fontSize={10}
            fill={this.color(link.name)}
            ><textPath
            href={"#edge-" + link.source.id + "-" + link.target.id}
            startOffset="50%"
            style={{
                textAnchor: "middle",
                pointerEvents:"none"
            }}
            >{link.name}</textPath></text></g>
          ))}
        </g>
      </svg>
    );
  }
}

ForceGraph.propTypes = {
  radius: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
};

ForceGraph.defaultProps = {
  radius: 10,
  width: 200,
  height: 200,
};

export default ForceGraph;
