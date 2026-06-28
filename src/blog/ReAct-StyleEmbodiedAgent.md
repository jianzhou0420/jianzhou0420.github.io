# What It Takes to Build a ReAct-Style Embodied Agent

Current VLA and WAM research mostly improves the embodied base models, but deployable embodied agents require a harness analogous to modern coding agents. Such a harness must maintain executable state, expose robot and simulator tools, enforce action contracts and safety boundaries, collect episode-level feedback, and route control among VLA policies, world-action predictors, planners, and low-level controllers. In this view, VLA and WAM are not complete agents: they are model components inside an embodied execution substrate.

## 1. Current Embodied Agentic Systems Are Still Workflows

The current embodied AI landscape already contains many systems that look agentic, but most of them are still better understood as task-specific LLM/VLM workflows rather than general ReAct-style embodied harnesses. In vision-language navigation, systems such as NavGPT, MapGPT, and SmartWay wrap language models with textual, topological, or metric scene representations so that navigation becomes reasoning over maps, landmarks, candidate viewpoints, and history. In manipulation and VLA-adjacent systems, SayCan, Code-as-Policies, VoxPoser, and ReKep compose foundation models with affordance scoring, code generation, keypoints, constraints, value maps, motion planners, and low-level controllers; the model usually produces an intermediate structure rather than directly owning the whole execution loop. This line should also be distinguished from embodied foundation models and end-to-end VLA policies such as RT-1, RT-2, OpenVLA, and π0, which are trained or adapted on robot-action data and are closer to embodied base models than explicit agent workflows. In embodied question answering, systems such as Explore-EQA, GraphEQA, and ToolEQA combine frozen VLMs with exploration policies, semantic maps, visual memory, scene graphs, confidence calibration, and specialized tools so that the agent can gather enough evidence before answering. Across these domains, the pattern is consistent: external state, tools, planners, and controllers are hand-wired around foundation models to make them useful in interactive environments. These systems are important because they show what embodied agents need — maps, memory, geometry, tool use, verification, and feedback — but they do not yet provide the embodied equivalent of a Codex-style harness. A workflow uses a model inside a pre-designed system; a harness would let the model operate a system.

## 2. What a ReAct-Style (coding-agent like) Embodied Agent looks like.

```
                  User Goal
                      ↓
          Embodied Reasoner / Task Planner
                      ↓
        ┌──────────────────────────────┐
        │       Embodied Harness        │
        │                              │
        │  State Manager                │
        │  Tool Router                  │
        │  Memory / Episode Logs        │
        │  Safety / Approval Layer      │
        │  Verifier / Recovery Manager  │
        └──────────────────────────────┘
          ↓          ↓          ↓
       Tools        Models     Controllers
       ↓            ↓          ↓
  SAM / 3D /     VLA / WAM /   MPC / PID /
  pose / SLAM    VLM / LLM     motion planner
       ↓            ↓          ↓
              Robot + World
```

The central challenge is to construct an embodied harness that exposes perception, geometry, memory, simulation, and control tools as typed, executable interfaces. In such a harness, segmentation models, 3D reconstruction modules, pose estimators, motion planners, and world-action predictors become callable tools whose outputs are logged, checked, and composed into action. This shifts embodied agents from monolithic vision-to-action policies toward tool-augmented execution systems.

## 3. Obstacles

The difficult part is not adding more tools to the robot stack. The difficult part is turning those tools into a harness: a typed, stateful, inspectable, and safe execution substrate that an agent can actually operate. Coding agents have a relatively clean workspace — files, commands, diffs, tests, logs. Embodied agents have a much harder workspace: the physical world.

| Obstacle | Why it is easy in coding agents | Why it is hard in embodied agents |
| --- | --- | --- |

1. Tool ecosystem
1.1 interface，分布式API
1.2 lifecycle，
1.3 state management




## 4. Adjacent Attempts

The closest attempts do not come from one unified line of work. They approach the embodied-harness problem from different sides: robot middleware, robot learning lifecycle, domain-specific agentic execution, self-improving robot policies, and editable agent substrates.

| Direction | Examples | What they make concrete | Why this is still not the full harness |
| --- | --- | --- | --- |
| **Robot stack as an agent interface** | ROSA, ROSClaw | ROS topics, services, actions, parameters, logs, capabilities, validation, and safety checks can be exposed to an LLM-facing interface. This turns the robot middleware into something an agent can inspect and operate. | The focus is still the robot stack interface or executive layer. It does not by itself define a general loop for open-ended task execution, dynamic perception-tool routing, VLA/WAM arbitration, recovery, and long-horizon world-state management. |
| **Robot lifecycle as an agentic loop** | RoboClaw | Data collection, policy learning, and task execution can be placed under one controller. Self-resetting action pairs make recovery and autonomous data collection part of the system rather than an external human operation. | This is closer to a lifecycle assistant for long-horizon manipulation than a general ReAct-style embodied harness. It makes learning and deployment more agentic, but within a specific manipulation framework. |
| **Domain-specific agentic execution** | AgentVLN | Navigation agents can use skill libraries, active exploration, self-correction, and explicit mechanisms for seeking missing geometric information. This makes the execution loop less static than earlier VLN workflows. | The abstraction is still navigation-specific. It improves one domain workflow rather than exposing a general embodied workspace shared by navigation, manipulation, EQA, and household tasks. |
| **Coding-agent-driven robot improvement** | ENPIRE, Robotics Harness Optimization, HARBOR | Coding agents can modify robot policies, rewards, environments, training recipes, or policy repositories using rollout feedback, logs, verification, and iterative evaluation. This brings the Codex-style edit–run–observe loop into robotics. | The agent is usually improving robot systems rather than acting as the deployed embodied agent. The robot is part of the evaluation loop, not yet the workspace of a general task-solving agent. |
| **Editable embodied agent substrate** | AgentCanvas | Embodied agents can be represented as typed, executable graphs: perception nodes, memory nodes, planners, tool-use nodes, controllers, and verifiers can be edited, run, logged, and compared. The architecture itself becomes the workspace. | This points most directly toward an embodied harness, but it is still a research substrate rather than a widely adopted runtime for deployed physical agents. |

These systems are important precisely because they do not solve the whole problem. Each one exposes a missing layer. ROSA and ROSClaw expose the robot stack. RoboClaw exposes the data–learning–execution lifecycle. AgentVLN exposes agentic decisions inside navigation. ENPIRE, Robotics Harness Optimization, and HARBOR expose robot improvement as an edit–execute–evaluate loop. AgentCanvas exposes the embodied agent architecture as an editable object.

The gap is the unified runtime: a general embodied harness where tools, models, controllers, world state, safety checks, execution logs, verification, and recovery are all exposed as typed interfaces that an agent can operate during task execution.
