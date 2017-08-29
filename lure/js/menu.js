let MenuTree = new Lure.Content({

    Target: '.main-menu',
    Content: `<div class="menu-common menu-box"></div>`,
    Controller: {
        Type: "TreeBuilder",
        Data: [
            {
                Name: 'Quick start',
                Id: 'menu-quick',
                Common: [
                    {
                        Name: `Hello World`,
                        Id: `cmn-hello`
                    },
                    {
                        Name: `More Samples`,
                        Id: `cmn-samples`
                    },
                    {
                        Name: `This menu sample`,
                        Id: `cmn-menu`
                    }
                ]
            },
            {
                Name: 'Content Constructor',
                CConstr: [
                    {
                        Name: 'General',
                        Id: 'cc-gen'
                    },
                    {
                        Name: 'Control',
                        Id: 'cc-control'
                    },
                    {
                        Name: 'SubContent',
                        Id: 'cc-subcontent'
                    }
                ]
            },
            {
                Name: 'Controller',
                Id: 'menu-controller',
                Controllers: [
                    {
                        Name: 'Templator',
                        Id: 'mt-main',
                        CTemplator: [
                            {
                                Name: 'Simple Refresh',
                                Id: 'mt-simplerefresh'
                            },

                        ]
                    },
                    {
                        Name: 'TreeBuilder',
                        Id: 'mtb-main',
                        CTreeBuilder: [
                            {
                                Name: 'General',
                                Id: 'mtb-general'
                            },

                        ]
                    }
                ]
            }
        ],
        ListElement: `<div class="menu-common__item menu__element" data-type="{{$key}}">
                        <div class="element head" data-type="{{$key}}" id="{{Id}}">{{Name}}</div>
                      </div>`
    }
});