import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Table } from "reactstrap";
import { EventWrapper } from "../lib/event";
import { fetchEvents } from "../utils/fetch";
import Error from "./Error";
import { StatusBadge } from "./utils";

interface Session {
  id: string;
  client: string;
  created: string;
  finished: any;
  status: string;
}

interface State {
  error: string;
  sessions: Session[];
}

class Sessions extends Component<{}, State> {
  readonly state: State = {
    error: null,
    sessions: []
  };
  private readonly unsubscribe: () => void;

  constructor(props: {}) {
    super(props);

    this.unsubscribe = fetchEvents(
      {
        event_types: [
          { value: "SessionNew", mode: "=" },
          { value: "SessionClosed", mode: "=" }
        ]
      },
      (events: EventWrapper[]) => {
        let state = this.state;
        for (const event of events) {
          if (event.event.type === "SessionNew") {
            const session = {
              id: event.event.session,
              client: event.event.client,
              created: event.time,
              finished: null as any,
              status: "Open"
            };
            state = { ...state, sessions: [...state.sessions, session] };
          } else if (event.event.type === "SessionClosed") {
            let status = "Closed";
            if (event.event.reason === "Error") {
              status = "Error";
            }
            if (event.event.reason === "ServerLost") {
              status = "Server lost";
            }
            const id = event.event.session;
            state = {
              ...state,
              sessions: state.sessions.map(
                s =>
                  s.id === id
                    ? {
                        ...s,
                        finished: event.time,
                        status
                      }
                    : s
              )
            };
          }
        }
        this.setState(state);
      },
      (error: string) => {
        this.setState(() => ({ error }));
      }
    );
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return (
      <div>
        <Error error={this.state.error} />
        <h1>Sessions</h1>

        <Table>
          <thead>
            <tr>
              <th>Session</th>
              <th>Status</th>
              <th>Client</th>
              <th>Created</th>
              <th>Finished</th>
            </tr>
          </thead>
          <tbody>
            {this.state.sessions &&
              this.state.sessions.map(s => {
                return (
                  <tr key={s.id}>
                    <td>
                      <Link to={"session/" + s.id}>Session {s.id}</Link>
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td>{s.client}</td>
                    <td>{s.created}</td>
                    <td>{s.finished && s.finished}</td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </div>
    );
  }
}

export default Sessions;