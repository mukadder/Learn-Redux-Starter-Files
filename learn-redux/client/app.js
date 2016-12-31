/** This is step 1
 * Created by mukadder on 12/30/16
import React, { Component } from 'react'
import { Router, Route, Link, IndexRoute, hashHistory, browserHistory } from 'react-router'
const App = () => <h1>Hello World!</h1>
export default App
*/
/** This is step 2Let’s set up a basic route. We will replace the App component with a React class,
 *  which will return a Router component. Router will wrap all of the routes we are going to define.
 Each route will be identified in a <Route> component. The <Route> component will take two properties: path and component.
 When a path matches the path given to the <Route> component, it will return the component specified.
 Now, if you navigate to http://localhost:8100/ you should see our Home component, and if you navigate to http://localhost:8100/#/address you should see our Address component.
 When using hash history, you’ll see an extra item in your query string that looks something like _k=123abc. This is a key that history uses to look up persistent state data in window.sessionStorage between page loads.
 Now, what happens if we hit a route that is not defined? Let’s set up a 404 route and component that will return if the route is not found:Now, let’s create add navigation to get us between pages.
 To do this, we will be using the <Link> component. <Link> is similar to using an html anchor tag.
 From the docs:
 The primary way to allow users to navigate around your application. <Link> will render a fully accessible anchor tag with the proper href.
 To do this, let’s first create a Nav component. Our Nav component will contain <Link> components, and will look like this:Now we need a way to make our Nav component persistent across all pages. To do this, we will wrap our child routes in a main <Route> component. We will also need to update our Home component, and create a new component called Container
 const Container = (props) => <div>
 <Nav />
 {props.children}
 </div>
 Now, let’s rewrite our App component to look like this. We are wrapping our HomePage, Address and NotFound routes inside the new Container route. We are also setting HomePage to be our IndexRoute. That means that when we hit http://localhost:8100, our Home component will render, as it is specified as the index:


 .
 */
import React, { Component } from 'react'
import { Router, Route, Link, IndexRoute, hashHistory, browserHistory, DefaultRoute, IndexLink } from 'react-router'

class App extends Component {
    render () {
        return (
            <Router history={hashHistory}>
                <Route path='/' component={Container}>
                    <IndexRoute component={Home} />
                    <Route path='/address' component={Address}>
                        <IndexRoute component={TwitterFeed} />
                        <Route path='instagram' component={Instagram} />
                        <Route path='query' component={Query} />
                    </Route>
                    <Route path='/about(/:name)' component={About} />
                    <Route path='/namedComponent' component={NamedComponents}>
                        <IndexRoute components={{ title: Title, subTitle: SubTitle }} />
                    </Route>
                    <Route path='*' component={NotFound} />
                </Route>
            </Router>
        )
    }
}

const Query = (props) => (
    <h2>{props.location.query.message}</h2>
)

const Title = () => (
    <h1>Hello from Title Component</h1>
)

const SubTitle = () => (
    <h1>Hello from SubTitle Component</h1>
)

const NamedComponents = (props) => (
    <div>
        {props.title}<br />
        {props.subTitle}
    </div>
)

const Nav = () => (
    <div>
        <IndexLink activeClassName='active' to='/'>Home</IndexLink>&nbsp;
        <IndexLink activeClassName='active' to='/address'>Address</IndexLink>&nbsp;
        <IndexLink activeClassName='active' to='/about'>About</IndexLink>&nbsp;
        <IndexLink activeClassName='active' to='/namedComponent'>Named Components</IndexLink>&nbsp;
        <IndexLink activeClassName='active' to={{ pathname: '/address/query', query: { message: 'Hello from Route Query' } }}>Route Query</IndexLink>
    </div>
)

const Container = (props) => <div>
    <Nav />
    {props.children}
</div>

const Home = () => <h1>Hello from Home!</h1>

const Address = (props) => <div>
    <br />
    <Link to='/address'>Twitter Feed</Link>&nbsp;
    <Link to='/address/instagram'>Instagram Feed</Link>
    <h1>We are located at 555 Jackson St.</h1>
    {props.children}
</div>

const Instagram = () => <h3>Instagram Feed</h3>
const TwitterFeed = () => <h3>Twitter Feed</h3>

const About = (props) => (
    <div>
        <h3>Welcome to the About Page</h3>
        { props.params.name && <h2>Hello, {props.params.name}</h2>}
    </div>
)

const NotFound = () => <h1>404.. This page is not found!</h1>

export default App