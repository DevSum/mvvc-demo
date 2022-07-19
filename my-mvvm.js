class MyMVVM {
    constructor({ el, data, methods }) {
        const root = document.getElementById(el.slice(1))
        if (root === null) {
            return
        }
        this.data = data
        this.methods = methods

        this.textBind = {}

        this.setResponsive(data)
        this.bindChildren(root)

        for (const key in data) {
            this[key] = data[key]
        }
    }

    setResponsive(data) {
        for (const key in data) {
            let v = data[key]
            Object.defineProperty(this, key, {
                get() {
                    return v
                },
                set(nv) {
                    v = nv
                    this.textBind[key]?.forEach(([node, nodeKey]) => {
                        node[nodeKey] = nv
                    })
                }
            })
        }
    }

    bindChildren(root) {
        if (root === undefined) {
            return
        }

        // bind methods
        for (let i = 0; i < root.attributes.length; i++) {
            const attr = root.attributes[i]
            if (attr.name.startsWith('inq-')) {
                if (attr.name.startsWith('inq-on')) {
                    root[attr.name.slice(7)] = this.methods[attr.value].bind(this)
                }
                if (attr.name.startsWith('inq-model')) {
                    const onInput = root.oninput
                    root.oninput = (newValue) => {
                        this[attr.value] = newValue.target.value
                        onInput()
                    }
                    this.bindTextContent(attr.value, root, 'value')
                }
            }
        }

        // bind variables
        for (let i = 0; i < root.childNodes.length; i++) {
            const node = root.childNodes[i]
            if (node.nodeType === 3) {
                let textContent = node.textContent
                let finalNodes = []
                let headIndex = 0
                let labelIndex = textContent.indexOf('{{')
                while (~labelIndex) {
                    finalNodes.push(textContent.slice(headIndex, labelIndex))

                    const tailIndex = textContent.indexOf('}}', labelIndex)
                    const key = textContent.slice(labelIndex + 2, tailIndex).trim()
                    const node = document.createTextNode('')
                    this.bindTextContent(key, node, 'textContent')
                    finalNodes.push(node)

                    headIndex = tailIndex + 2
                    labelIndex = textContent.indexOf('{{', headIndex)
                }
                finalNodes.push(textContent.slice(headIndex))
                node.before(...finalNodes)
                node.remove()
                i += finalNodes.length - 1
            } else {
                this.bindChildren(node)
            }
        }
    }

    bindTextContent(key, node, nodeKey) {
        if (this.textBind[key] === undefined) {
            this.textBind[key] = []
        }
        this.textBind[key].push([node, nodeKey])
    }
}
